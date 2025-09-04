import { CreateRequestContext, EntityManager } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'src/i18n/i18n.service';
import { Subscription } from 'src/subscription/subscription.entity';
import { BotMessagingService } from 'src/telegram/services';
import { User } from 'src/user/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly i18n: I18nService,
    private readonly bot: BotMessagingService,
  ) { }

  /**
   * Крон ежечасно.
   * Выбираем всех пользователей, у кого наступил кратный 7 дням период неактивности по их локальным суткам,
   * и отправляем напоминание в их локальные 12:00.
   */
  @Cron('0 * * * *')
  @CreateRequestContext()
  async sendInactiveReminders(): Promise<void> {
    const now = new Date();
    // UTC-порог 7 суток назад (быстрая отсечка на уровне БД)
    const sevenDaysAgoUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 7 * 24 * 60 * 60 * 1000,
    );

    // Берём минимальный набор полей + смещение часового пояса, вычисленное БД.
    // ВНИМАНИЕ: EXTRACT(timezone FROM timestamptz) возвращает смещение в секундах для указанного значения.
    type InactiveRow = {
      telegramId: string;
      firstName: string | null;
      username: string | null;
      languageCode: string | null;
      lastMessageAt: string | Date | null;
      tzOffsetSeconds: number | null;
    };

    const rows: InactiveRow[] = await (this.em as unknown as SqlEntityManager)
      .createQueryBuilder(User, 'u')
      .select(['u.telegramId', 'u.firstName', 'u.username', 'u.languageCode', 'u.lastMessageAt'])
      .addSelect('extract(timezone from u.last_message_at) as "tzOffsetSeconds"')
      .where('u.last_message_at is not null')
      .andWhere('u.last_message_at <= ?', [sevenDaysAgoUtc])
      .execute();

    if (!rows.length) {
      this.logger.debug('Нет кандидатов для напоминаний об неактивности');
      return;
    }

    const tasks = rows
      .filter((row) => {
        const lastMessageAt = row.lastMessageAt ? new Date(row.lastMessageAt) : undefined;
        const offsetSec = typeof row.tzOffsetSeconds === 'number' ? row.tzOffsetSeconds : 0;
        // Шлём только в локальные 12:00 пользователя
        const localHour = this.getLocalHour(now, offsetSec);
        return this.isMultipleOfSevenDaysWithOffset(lastMessageAt, now, offsetSec) && localHour === 12;
      })
      .map(async (row) => {
        try {
          const locale = row.languageCode || this.i18n.getDefaultLocale();
          const raw = this.i18n.t('notification_inactive_recall', locale, {
            first_name: row.firstName || row.username || '',
          });
          const text = raw.replace(/\\n/g, '\n');
          await this.bot.sendPlainText(Number(row.telegramId), text);
        } catch (error) {
          this.logger.warn(
            `Не удалось отправить напоминание пользователю ${row.telegramId}: ${String(error)}`,
          );
        }
      });

    await Promise.allSettled(tasks);
  }

  /**
   * Крон: ежечасно отправляем напоминания за 3 и за 1 день до окончания подписки (autoRenew=false),
   * ориентируясь на локальные сутки пользователя и шлём в его локальные 12:00.
   * Запуск — один раз в час, без дедупликации.
   */
  @Cron('0 * * * *')
  @CreateRequestContext()
  async sendSubscriptionExpiryReminders(): Promise<void> {
    const now = new Date();
    // Ограничиваем выборку окнами по UTC для производительности
    const inThreeDaysUtc = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    type ExpiryRow = {
      id: string;
      periodEnd: string | Date;
      telegramId: string;
      languageCode: string | null;
      tzOffsetSeconds: number | null;
    };

    const rows: ExpiryRow[] = await (this.em as unknown as SqlEntityManager)
      .createQueryBuilder(Subscription, 's')
      .select(['s.id', 's.periodEnd'])
      .join('s.user', 'u')
      .addSelect(['u.telegramId', 'u.languageCode'])
      .addSelect('extract(timezone from u.last_message_at) as "tzOffsetSeconds"')
      .where({ status: 'active', autoRenew: false })
      .andWhere('s.period_end >= ? and s.period_end <= ?', [now, inThreeDaysUtc])
      .execute();

    if (!rows.length) return;

    const tasks = rows.map(async (row) => {
      const locale = row.languageCode || this.i18n.getDefaultLocale();
      const offsetSec = typeof row.tzOffsetSeconds === 'number' ? row.tzOffsetSeconds : 0;

      // Шлём только в локальные 12:00 пользователя
      const localHour = this.getLocalHour(now, offsetSec);
      if (localHour !== 12) return;

      const periodEnd = new Date(row.periodEnd);
      const daysLeft = this.daysUntilLocalMidnight(periodEnd, now, offsetSec);
      if (daysLeft !== 3 && daysLeft !== 1) return;

      const premium_expires_at = this.formatDateByLocale(periodEnd, locale);
      const i18nKey = daysLeft === 3 ? 'subscription_expiring_3_days' : 'subscription_expiring_1_day';
      const text = this.i18n.t(i18nKey, locale, { premium_expires_at });

      try {
        await this.bot.sendTextWithTopupButton(Number(row.telegramId), text, locale);
      } catch (error) {
        this.logger.warn(
          `Не удалось отправить уведомление о подписке ${row.id} пользователю ${row.telegramId}: ${String(error)}`,
        );
      }
    });

    await Promise.allSettled(tasks);
  }

  /** Возвращает количество полных дней до локальной полуночи пользователя (по смещению в секундах) */
  private daysUntilLocalMidnight(target: Date, now: Date, offsetSeconds: number): number {
    const targetLocalMidnight = this.getLocalMidnight(target, offsetSeconds);
    const nowLocalMidnight = this.getLocalMidnight(now, offsetSeconds);
    return Math.floor((targetLocalMidnight.getTime() - nowLocalMidnight.getTime()) / (24 * 60 * 60 * 1000));
  }

  /** Форматирует дату согласно локали пользователя */
  private formatDateByLocale(date: Date, locale: string): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('ru', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    }
  }

  /**
   * Проверяет, что now - lastMessageAt кратно 7 дням (с точностью до суток в локальном времени пользователя).
   */
  private isMultipleOfSevenDaysWithOffset(
    lastMessageAt: Date | undefined,
    now: Date,
    offsetSeconds: number,
  ): boolean {
    if (!lastMessageAt) return false;
    const lastLocalMidnight = this.getLocalMidnight(lastMessageAt, offsetSeconds);
    const todayLocalMidnight = this.getLocalMidnight(now, offsetSeconds);
    const msDiff = todayLocalMidnight.getTime() - lastLocalMidnight.getTime();
    if (msDiff < 7 * 24 * 60 * 60 * 1000) return false;
    const days = Math.floor(msDiff / (24 * 60 * 60 * 1000));
    return days % 7 === 0;
  }

  /** Возвращает UTC-время, соответствующее локальной полуночи пользователя по его смещению */
  private getLocalMidnight(date: Date, offsetSeconds: number): Date {
    const local = new Date(date.getTime() + offsetSeconds * 1000);
    const localMidnight = Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      0,
      0,
      0,
      0,
    );
    return new Date(localMidnight - offsetSeconds * 1000);
  }

  /** Час локального времени пользователя для данного UTC now */
  private getLocalHour(nowUtc: Date, offsetSeconds: number): number {
    const local = new Date(nowUtc.getTime() + offsetSeconds * 1000);
    return local.getUTCHours();
  }
}

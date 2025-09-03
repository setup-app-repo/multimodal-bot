import { CreateRequestContext, EntityManager } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'src/i18n/i18n.service';
import { Subscription } from 'src/subscription/subscription.entity';
import { BotService } from 'src/telegram/services/bot.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly i18n: I18nService,
    private readonly bot: BotService,
  ) {}

  /**
   * Крон ежедневно в 12:00 UTC.
   * Выбираем всех пользователей, у кого наступил кратный 7 дням период неактивности, и шлём напоминание.
   */
  @Cron('0 12 * * *')
  @CreateRequestContext()
  async sendInactiveReminders(): Promise<void> {
    const now = new Date();
    const nowUtcMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    // Выбираем пользователей с последней активностью >= 7 дней назад
    const sevenDaysAgo = new Date(
      nowUtcMidnight.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const users = await this.em.find(User, {
      lastMessageAt: { $lte: sevenDaysAgo },
    });

    if (!users.length) {
      this.logger.debug('Нет кандидатов для напоминаний об неактивности');
      return;
    }

    const tasks = users
      .filter((user) =>
        this.isMultipleOfSevenDays(user.lastMessageAt, nowUtcMidnight),
      )
      .map(async (user) => {
        try {
          const locale = user.languageCode || this.i18n.getDefaultLocale();
          const raw = this.i18n.t('notification_inactive_recall', locale, {
            first_name: user.firstName || user.username || '',
          });

          const text = raw.replace(/\\n/g, '\n');
          await this.bot.sendPlainText(Number(user.telegramId), text);
        } catch (error) {
          this.logger.warn(
            `Не удалось отправить напоминание пользователю ${user.telegramId}: ${String(error)}`,
          );
        }
      });

    await Promise.all(tasks);
  }

  /**
   * Крон: ежедневно отправляем напоминания за 3 и за 1 день до окончания подписки (autorenew=false).
   * Запуск один раз в день, без дедупликации.
   */
  @Cron('0 12 * * *')
  @CreateRequestContext()
  async sendSubscriptionExpiryReminders(): Promise<void> {
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const subs = await this.em.find(
      Subscription,
      {
        status: 'active',
        autoRenew: false,
        periodEnd: { $gte: now, $lte: inThreeDays },
      },
      { populate: ['user'] },
    );

    if (!subs.length) return;

    const tasks = subs.map(async (sub) => {
      const user = sub.user;
      const locale = user.languageCode || this.i18n.getDefaultLocale();
      const daysLeft = this.daysUntilUtcMidnight(sub.periodEnd, now);
      if (daysLeft !== 3 && daysLeft !== 1) return;

      const premium_expires_at = this.formatDateByLocale(sub.periodEnd, locale);
      const i18nKey =
        daysLeft === 3
          ? 'subscription_expiring_3_days'
          : 'subscription_expiring_1_day';
      const text = this.i18n.t(i18nKey, locale, { premium_expires_at });

      try {
        await this.bot.sendTextWithTopupButton(
          Number(user.telegramId),
          text,
          locale,
        );
      } catch (error) {
        this.logger.warn(
          `Не удалось отправить уведомление о подписке ${sub.id} пользователю ${user.telegramId}: ${String(error)}`,
        );
      }
    });

    await Promise.all(tasks);
  }

  /** Возвращает количество полных дней до полуночи UTC по дате окончания */
  private daysUntilUtcMidnight(target: Date, now: Date): number {
    const targetUTC = Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
    );
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    return Math.floor((targetUTC - nowUTC) / (24 * 60 * 60 * 1000));
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
   * Проверяет, что now - lastMessageAt кратно 7 дням (с точностью до суток, UTC).
   */
  private isMultipleOfSevenDays(
    lastMessageAt: Date | undefined,
    todayUtcMidnight: Date,
  ): boolean {
    if (!lastMessageAt) return false;
    const lastUtcMidnight = new Date(
      Date.UTC(
        lastMessageAt.getUTCFullYear(),
        lastMessageAt.getUTCMonth(),
        lastMessageAt.getUTCDate(),
      ),
    );
    const msDiff = todayUtcMidnight.getTime() - lastUtcMidnight.getTime();
    if (msDiff < 7 * 24 * 60 * 60 * 1000) return false;
    const days = Math.floor(msDiff / (24 * 60 * 60 * 1000));

    return days % 7 === 0;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRequestContext, EntityManager } from '@mikro-orm/core';

import { User } from 'src/user/user.entity';
import { I18nService } from 'src/i18n/i18n.service';
import { BotService } from 'src/telegram/services/bot.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly i18n: I18nService,
    private readonly bot: BotService,
  ) {}

  /**
   * Крон ежедневно в 15:00 UTC.
   * Выбираем всех пользователей, у кого наступил кратный 7 дням период неактивности, и шлём напоминание.
   */
  @CreateRequestContext()
  @Cron(CronExpression.EVERY_DAY_AT_3PM)
  async sendInactiveReminders(): Promise<void> {
    const now = new Date();
    const nowUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Выбираем пользователей с последней активностью >= 7 дней назад
    const sevenDaysAgo = new Date(nowUtcMidnight.getTime() - 7 * 24 * 60 * 60 * 1000);

    const users = await this.em.find(User, {
      lastMessageAt: { $lte: sevenDaysAgo },
    });

    if (!users.length) {
      this.logger.debug('Нет кандидатов для напоминаний об неактивности');
      return;
    }

    const tasks = users
      .filter((user) => this.isMultipleOfSevenDays(user.lastMessageAt, nowUtcMidnight))
      .map(async (user) => {
        try {
          const locale = user.languageCode || this.i18n.getDefaultLocale();
          const text = this.i18n.t('notification_inactive_recall', locale, {
            first_name: user.firstName || user.username || '',
          });

          await this.bot.sendPlainText(Number(user.telegramId), text);
        } catch (error) {
          this.logger.warn(`Не удалось отправить напоминание пользователю ${user.telegramId}: ${String(error)}`);
        }
      });

    await Promise.all(tasks);
  }

  /**
   * Проверяет, что now - lastMessageAt кратно 7 дням (с точностью до суток, UTC).
   */
  private isMultipleOfSevenDays(lastMessageAt: Date | undefined, todayUtcMidnight: Date): boolean {
    if (!lastMessageAt) return false;
    const lastUtcMidnight = new Date(Date.UTC(
      lastMessageAt.getUTCFullYear(),
      lastMessageAt.getUTCMonth(),
      lastMessageAt.getUTCDate(),
    ));
    const msDiff = todayUtcMidnight.getTime() - lastUtcMidnight.getTime();
    if (msDiff < 7 * 24 * 60 * 60 * 1000) return false;
    const days = Math.floor(msDiff / (24 * 60 * 60 * 1000));
    return days % 7 === 0;
  }
}



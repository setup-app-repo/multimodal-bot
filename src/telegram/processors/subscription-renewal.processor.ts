import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CreateRequestContext, EntityManager } from '@mikro-orm/core';

import { SetupAppService } from 'src/setup-app/setup-app.service';
import { Subscription } from 'src/subscription/subscription.entity';
import { BotService } from '../services/bot.service';
import { PREMIUM_SUBSCRIPTION_COST_SP } from '../constants';
import { I18nService } from 'src/i18n/i18n.service';

@Processor('subscription-renewal')
@Injectable()
export class SubscriptionRenewalProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionRenewalProcessor.name);

  constructor(
    private readonly em: EntityManager,
    private readonly setupAppService: SetupAppService,
    private readonly botService: BotService,
    private readonly i18n: I18nService,
  ) { super(); }

  /**
   * Доклады job.data: { telegramId: number, subscriptionId: string }
   */
  @CreateRequestContext()
  async process(job: Job<{ telegramId: number; subscriptionId: string }>): Promise<void> {
    const { telegramId, subscriptionId } = job.data;
    try {
      const sub = await this.em.findOne(Subscription, { id: subscriptionId }, { populate: ['user'] });
      if (!sub || sub.status !== 'active' || !sub.autoRenew) {
        return;
      }

      // На всякий случай проверим, действительно ли период закончился
      const now = new Date();
      if (sub.periodEnd > now) {
        return;
      }

      const amount = PREMIUM_SUBSCRIPTION_COST_SP;
      const description = `Автопродление подписки "Premium" ${PREMIUM_SUBSCRIPTION_COST_SP} SP`;

      const hasEnough = await this.setupAppService.have(telegramId, amount);
      const locale = sub.user?.languageCode || this.i18n.getDefaultLocale();
      const balance = await this.setupAppService.getBalance(telegramId).catch(() => 0);

      if (!hasEnough) {
        sub.status = 'expired';
        await this.em.persistAndFlush(sub);

        const text = this.i18n.t('autorenew_failed_insufficient_sp', locale, {
          required: String(amount),
          balance: String(balance),
        });
        await this.botService.sendTextWithTopupButton(telegramId, text, locale);
        return;
      }

      await this.setupAppService.deduct(telegramId, amount, description);

      // Обновляем период: с текущего момента на 30 дней
      const newStart = new Date();
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + 30);
      sub.periodStart = newStart;
      sub.periodEnd = newEnd;
      sub.status = 'active';
      await this.em.persistAndFlush(sub);

      const premium_expires_at = newEnd.toLocaleDateString(
        locale === 'ru' ? 'ru-RU' : locale,
        { year: 'numeric', month: 'long', day: 'numeric' }
      ).replace(/[\u2068\u2069]/g, '');
      const newBalance = await this.setupAppService.getBalance(telegramId).catch(() => balance - amount);
      const successText = this.i18n.t('autorenew_success', locale, {
        premium_expires_at,
        balance: String(newBalance),
      });
      await this.botService.sendPlainText(telegramId, successText);
    } catch (error) {
      this.logger.error(`Renewal job failed for ${job.id}`, error as any);
      throw error;
    }
  }
}



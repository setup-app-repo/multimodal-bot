import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EntityManager } from '@mikro-orm/core';

import { SetupAppService } from 'src/setup-app/setup-app.service';
import { Subscription } from 'src/subscription/subscription.entity';
import { BotService } from '../services/bot.service';

@Processor('subscription-renewal')
@Injectable()
export class SubscriptionRenewalProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionRenewalProcessor.name);

  constructor(
    private readonly em: EntityManager,
    private readonly setupAppService: SetupAppService,
    private readonly botService: BotService,
  ) { super(); }

  /**
   * Доклады job.data: { telegramId: number, subscriptionId: string }
   */
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

      const amount = 10; // TODO: вынести в конфиг при необходимости
      const description = 'Автопродление подписки "Premium" 10 SP';

      const hasEnough = await this.setupAppService.have(telegramId, amount);
      if (!hasEnough) {
        sub.status = 'expired';
        await this.em.persistAndFlush(sub);
        await this.botService.sendPlainText(telegramId, '⚠️ Недостаточно SP для автопродления. Пополните баланс, подписка переведена в статус expired.');
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

      await this.botService.sendPlainText(telegramId, '✅ Подписка успешно продлена на 30 дней. Спасибо!');
    } catch (error) {
      this.logger.error(`Renewal job failed for ${job.id}`, error as any);
      throw error;
    }
  }
}



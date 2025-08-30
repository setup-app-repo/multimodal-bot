import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/core';

import { SetupAppService } from 'src/setup-app/setup-app.service';
import { Subscription } from './subscription.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly em: EntityManager,
    private readonly setupAppService: SetupAppService,
  ) {}
  /**
   * Списывает средства у пользователя через Setup.app и создаёт запись подписки в БД в одной операции.
   * Примечание: внешнее списание невозвратно и не участвует в транзакции БД.
   */
  async chargeAndCreateSubscription(
    telegramId: number,
    amount: number,
    description: string,
    options?: { periodDays?: number; autoRenew?: boolean }
  ): Promise<Subscription> {
    const periodDays = options?.periodDays ?? 30;
    const autoRenew = options?.autoRenew ?? false;

    // 0) Проверяем, что пользователь существует в БД, прежде чем списывать средства
    const user = await this.em.findOne(User, { telegramId: String(telegramId) });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 1) Сначала пытаемся списать средства через внешний сервис
    await this.setupAppService.deduct(telegramId, amount, description);

    return await this.em.transactional(async (tem) => {
      const now = new Date();
      const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

      const subscription = tem.create(Subscription, {
        user,
        periodStart: now,
        periodEnd: end,
        autoRenew,
        status: 'active',
        createdAt: new Date(),
      });

      await tem.persistAndFlush(subscription);
      return subscription;
    });
  }

  @CreateRequestContext()
  /**
   * Проверяет, есть ли у пользователя активная подписка
   */
  async hasActiveSubscription(telegramId: string): Promise<boolean> {
    const now = new Date();

    const user = await this.em.findOne(User, { telegramId: telegramId });
    console.log('User:', user);
    if (!user) return false;

    const subscription = await this.em.findOne(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    return subscription !== null;
  }
}

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
   */
  @CreateRequestContext()
  async chargeAndCreateSubscription(
    telegramId: number,
    amount: number,
    description: string,
    options?: { periodDays?: number; autoRenew?: boolean }
  ): Promise<Subscription> {
    const periodDays = options?.periodDays ?? 30;
    const autoRenew = options?.autoRenew ?? false;


    const user = await this.em.findOne(User, { telegramId: String(telegramId) });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const now = new Date();
    const activeSubsCount = await this.em.count(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    if (activeSubsCount > 0) {
      throw new Error('ALREADY_HAS_ACTIVE_SUBSCRIPTION');
    }

    const hasEnoughSP = await this.setupAppService.have(telegramId, amount);

    if (!hasEnoughSP) {
      throw new Error('INSUFFICIENT_FUNDS');
    }


    await this.setupAppService.deduct(telegramId, amount, description);

    return await this.em.transactional(async (tem) => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + periodDays);

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
    if (!user) return false;

    const subscription = await this.em.findOne(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    return subscription !== null;
  }

  @CreateRequestContext()
  /**
   * Возвращает активную подписку пользователя или null, если её нет
   */
  async getActiveSubscription(telegramId: string): Promise<Subscription | null> {
    const now = new Date();
    const user = await this.em.findOne(User, { telegramId: telegramId });
    if (!user) return null;

    const subscription = await this.em.findOne(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    return subscription;
  }

  @CreateRequestContext()
  /**
   * Устанавливает флаг автопродления для активной подписки пользователя
   */
  async setAutoRenew(telegramId: string, value: boolean): Promise<Subscription | null> {
    const now = new Date();
    const user = await this.em.findOne(User, { telegramId });
    if (!user) return null;

    const subscription = await this.em.findOne(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    if (!subscription) return null;

    subscription.autoRenew = value;
    await this.em.persistAndFlush(subscription);
    return subscription;
  }
}

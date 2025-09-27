import { CreateRequestContext, EntityManager } from '@mikro-orm/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { User } from 'src/user/user.entity';

import { Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly em: EntityManager,
    private readonly setupAppService: SetupAppService,
    @InjectQueue('subscription-renewal') private readonly renewalQueue: Queue,
  ) { }
  /**
   * Списывает средства у пользователя через Setup.app и создаёт запись подписки в БД в одной операции.
   */
  @CreateRequestContext()
  async chargeAndCreateSubscription(
    telegramId: number,
    amount: number,
    description: string,
    options?: { periodDays?: number; autoRenew?: boolean },
  ): Promise<Subscription> {
    const periodDays = options?.periodDays ?? 30;
    const autoRenew = options?.autoRenew ?? false;

    const user = await this.em.findOne(User, {
      telegramId: String(telegramId),
    });

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
   * Продлевает активную подписку на periodDays с предварительной проверкой и списанием SP
   */
  async extendActiveSubscriptionWithCharge(
    telegramId: number,
    amount: number,
    description: string,
    periodDays: number = 30,
  ): Promise<Subscription> {
    const now = new Date();
    const user = await this.em.findOne(User, { telegramId: String(telegramId) });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const active = await this.em.findOne(Subscription, {
      user,
      status: 'active',
      periodStart: { $lte: now },
      periodEnd: { $gte: now },
    });

    if (!active) {
      throw new Error('NO_ACTIVE_SUBSCRIPTION');
    }

    const hasEnoughSP = await this.setupAppService.have(telegramId, amount);
    if (!hasEnoughSP) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    await this.setupAppService.deduct(telegramId, amount, description);

    return await this.em.transactional(async (tem) => {
      const currentEnd = new Date(active.periodEnd);
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + periodDays);
      active.periodEnd = newEnd;
      await tem.persistAndFlush(active);
      return active;
    });
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

  /**
   * Крон: каждые 5 минут находит все активные подписки с истёкшим периодом.
   * Для autoRenew=true — ставит задачу на продление, для остальных — помечает как expired.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  @CreateRequestContext()
  async handleExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    const subs = await this.em.find(
      Subscription,
      {
        status: 'active',
        periodEnd: { $lte: now },
      },
      { populate: ['user'] },
    );

    if (!subs.length) return;

    for (const sub of subs) {
      if (sub.autoRenew) {
        const telegramId = Number(sub.user.telegramId);
        await this.renewalQueue.add(
          'renew',
          {
            telegramId,
            subscriptionId: sub.id,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
            removeOnComplete: 1000,
            removeOnFail: 1000,
          },
        );
      } else {
        sub.status = 'expired';
        await this.em.persistAndFlush(sub);
      }
    }
  }
}

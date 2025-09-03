import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { RedisService } from 'src/redis/redis.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { I18nService } from 'src/i18n/i18n.service';
import { BotContext } from '../interfaces';
import { getPriceSP, MODEL_TO_TIER, ModelTier, DAILY_BASE_FREE_LIMIT } from '../constants';

export interface AccessCheckResult {
  canProceed: boolean;
  price: number;
  reason?: 'insufficient_funds' | 'daily_limit_reached';
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly subscriptionService: SubscriptionService,
    private readonly setupAppService: SetupAppService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Проверяет доступ пользователя к использованию модели с учетом подписки, SP и лимитов
   */
  async checkAccess(
    ctx: BotContext,
    userId: string,
    model: string,
    priceMultiplier: number = 1,
  ): Promise<AccessCheckResult> {
    const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
    const basePrice = getPriceSP(model, hasActiveSubscription);
    const price = basePrice * priceMultiplier;
    const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
    const isBaseNoSub = !hasActiveSubscription && tier === ModelTier.BASE;

    this.logger.log(
      `Access check for user ${userId}: model=${model}, tier=${tier}, hasSubscription=${hasActiveSubscription}, price=${price}`,
    );

    // Проверка SP для платных моделей
    if (!isBaseNoSub) {
      const hasEnoughSP = await this.setupAppService.have(Number(userId), price);
      if (!hasEnoughSP) {
        await this.sendInsufficientFundsMessage(ctx);
        return { canProceed: false, price, reason: 'insufficient_funds' };
      }
    }

    // Проверка суточных лимитов для BASE модели без подписки
    if (isBaseNoSub) {
      try {
        const usedToday = await this.redisService.incrementDailyBaseCount(userId);
        if (usedToday > DAILY_BASE_FREE_LIMIT) {
          await this.sendDailyLimitMessage(ctx);
          return { canProceed: false, price, reason: 'daily_limit_reached' };
        }
        this.logger.log(`User ${userId} used ${usedToday}/${DAILY_BASE_FREE_LIMIT} free requests today`);
      } catch (limitError) {
        this.logger.error(`Daily limit check failed for user ${userId}:`, limitError);
        // В случае ошибки проверки лимита, разрешаем доступ
      }
    }

    return { canProceed: true, price };
  }

  /**
   * Списывает SP с аккаунта пользователя, если это необходимо
   */
  async deductSPIfNeeded(
    userId: string,
    model: string,
    price: number,
    description: string,
  ): Promise<void> {
    const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
    if (tier !== ModelTier.BASE && price > 0) {
      await this.setupAppService.deduct(Number(userId), price, description);
      this.logger.log(`Deducted ${price} SP from user ${userId} for: ${description}`);
    }
  }

  /**
   * Проверяет, поддерживает ли модель медиа-контент (не BASE уровень)
   */
  isMediaSupportedByModel(model: string): boolean {
    const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
    return tier !== ModelTier.BASE;
  }

  /**
   * Отправляет сообщение о недостатке средств с кнопкой пополнения
   */
  private async sendInsufficientFundsMessage(ctx: BotContext): Promise<void> {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    const message = this.i18n.t('insufficient_funds', userLang);
    const buttonText = this.i18n.t('topup_sp_button', userLang);
    
    const keyboard = new InlineKeyboard().text(buttonText, 'wallet:topup');
    await ctx.reply(message, { reply_markup: keyboard });
  }

  /**
   * Отправляет сообщение о достижении суточного лимита
   */
  private async sendDailyLimitMessage(ctx: BotContext): Promise<void> {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    const message = this.i18n.t('daily_limit_reached', userLang);
    await ctx.reply(message);
  }

  /**
   * Отправляет сообщение о том, что бесплатная модель не поддерживает медиа
   */
  async sendFreeModelNoMediaMessage(ctx: BotContext): Promise<void> {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    const message = this.i18n.t('warning_free_model_no_media', userLang);
    await ctx.reply(message);
  }
}

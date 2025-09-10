import { InlineKeyboard } from 'grammy';

import {
  DEFAULT_MODEL,
  getPriceSP,
  MODELS_SUPPORTING_AUDIO,
  MODELS_SUPPORTING_FILES,
  MODELS_SUPPORTING_PHOTOS,
  PREMIUM_SUBSCRIPTION_COST_SP,
} from '../../constants';
import { BotContext } from '../../interfaces';
import { getModelDisplayName } from '../../utils/model-display';
import { RegisterCommandsDeps, ScreenData } from '../utils/types';

export class ProfileScreen {
  constructor(private deps: RegisterCommandsDeps) { }

  private getLanguageNameWithoutFlag(ctx: BotContext, code: string): string {
    const { t } = this.deps;
    const key =
      code === 'en'
        ? 'language_english'
        : code === 'ru'
          ? 'language_russian'
          : code === 'es'
            ? 'language_spanish'
            : code === 'de'
              ? 'language_german'
              : code === 'pt'
                ? 'language_portuguese'
                : 'language_french';
    const fullLabel = t(ctx, key);
    return fullLabel.replace(/^(?:\uD83C[\uDDE6-\uDDFF]){2}\s*/, '').trim();
  }

  async build(ctx: BotContext): Promise<ScreenData> {
    const { t, i18n, redisService, setupAppService, subscriptionService } = this.deps;
    const userId = String(ctx.from?.id);
    const model = (await redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

    const currentLang = ctx.session.lang || i18n.getDefaultLocale();
    const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

    let spBalance = 0;
    try {
      spBalance = await setupAppService.getBalance(ctx.from?.id as number);
    } catch { }
    const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
    const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

    const balanceLine = t(ctx, 'profile_balance', {
      balance: spBalance,
    }).replace(/^(?:[^:]+:)/, (m) => `<b>${m}</b>`);
    const premiumLine = t(ctx, 'profile_premium', {
      status: premiumLabel,
    }).replace(/^(?:[^:]+:)/, (m) => `<b>${m}</b>`);
    const modelLine = t(ctx, 'current_model', { model: modelDisplay }).replace(
      /^(?:[^:]+:)/,
      (m) => `<b>${m}</b>`,
    );
    const langLine = t(ctx, 'current_language', {
      lang: this.getLanguageNameWithoutFlag(ctx, currentLang),
    }).replace(/^(?:[^:]+:)/, (m) => `<b>${m}</b>`);

    const text =
      `⚙️ ${t(ctx, 'profile_title')}\n\n` +
      `💰 ${balanceLine}\n` +
      `⭐ ${premiumLine}\n` +
      `${modelLine}\n` +
      `${langLine}`;

    let topupUrl: string | undefined;
    try {
      topupUrl = await setupAppService.getBuySetupPointsUrl();
    } catch { }

    const keyboard = new InlineKeyboard()
      .text(t(ctx, 'profile_language_button'), 'profile_language')
      .text(t(ctx, 'profile_premium_button'), 'profile:premium')
      .row()
    [topupUrl ? 'webApp' : 'text'](t(ctx, 'topup_sp_button'), topupUrl || 'wallet:topup')
      .row()
      .text(t(ctx, 'profile_clear_button'), 'profile_clear');

    return { text, keyboard, parse_mode: 'HTML' };
  }
}

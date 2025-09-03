import { InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { getLocaleCode } from '../utils/locale.utils';
import { RegisterCommandsDeps, ScreenData } from '../utils/types';

export class PremiumScreen {
  constructor(private deps: RegisterCommandsDeps) {}

  async build(ctx: BotContext): Promise<ScreenData> {
    const { subscriptionService, t } = this.deps;
    const telegramId = String(ctx.from?.id);
    const hasActive = await subscriptionService.hasActiveSubscription(telegramId);
    if (hasActive) {
      return this.buildActive(ctx);
    }
    const text =
      `${t(ctx, 'premium_confirm_title')}\n\n` +
      `${t(ctx, 'premium_confirm_benefits_title')}\n` +
      `${t(ctx, 'premium_confirm_benefit_1')}\n` +
      `${t(ctx, 'premium_confirm_benefit_2')}\n` +
      `${t(ctx, 'premium_confirm_benefit_3')}\n` +
      `${t(ctx, 'premium_confirm_benefit_4')}\n` +
      `${t(ctx, 'premium_confirm_benefit_5')}\n` +
      `${t(ctx, 'premium_confirm_benefit_6')}\n\n` +
      `${t(ctx, 'premium_confirm_footer')}`;
    const keyboard = new InlineKeyboard()
      .text(t(ctx, 'premium_activate_button'), 'premium:activate')
      .row()
      .text(t(ctx, 'premium_back_button'), 'ui:back');
    return { text, keyboard, parse_mode: 'HTML' };
  }

  async buildActive(ctx: BotContext): Promise<ScreenData> {
    const { t, setupAppService, subscriptionService } = this.deps;
    const activeSub = await subscriptionService.getActiveSubscription(String(ctx.from?.id));
    let expiresAtDate: Date | null = null;
    let autorenew = false;
    if (activeSub) {
      expiresAtDate = new Date(activeSub.periodEnd);
      autorenew = Boolean(activeSub.autoRenew);
    }
    const msLeft = (expiresAtDate?.getTime() ?? Date.now()) - Date.now();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const locale = getLocaleCode(ctx);
    const expiresAt = expiresAtDate
      ? expiresAtDate
          .toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          .replace(/[\u2068\u2069]/g, '')
      : '';
    const autorenewLabelPlain = autorenew ? t(ctx, 'switch_on') : t(ctx, 'switch_off');
    const autorenewLabel = `<b>${autorenewLabelPlain}</b>`;

    const header = t(ctx, 'premium_active_title');
    let balance = 0;
    try {
      balance = await setupAppService.getBalance(ctx.from?.id as number);
    } catch {}
    const body = t(ctx, 'premium_active_text', {
      expires_at: expiresAt,
      days_left: String(daysLeft),
      autorenew: autorenewLabel,
      balance: String(balance),
    }).replace(/\\n/g, '\n');

    const keyboard = new InlineKeyboard()
      .text(t(ctx, 'premium_extend_30_button'), 'premium:extend')
      .row()
      .text(
        autorenew
          ? t(ctx, 'premium_autorenew_toggle_button_on', {
              on: t(ctx, 'switch_on'),
            })
          : t(ctx, 'premium_autorenew_toggle_button_off', {
              off: t(ctx, 'switch_off'),
            }),
        'premium:toggle_autorenew',
      )
      .row()
      .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
      .row()
      .text(t(ctx, 'premium_back_button'), 'ui:back');

    const text = `${header}\n${body}`;
    return { text, keyboard };
  }
}

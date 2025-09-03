import { Bot, InlineKeyboard } from 'grammy';

import { PREMIUM_SUBSCRIPTION_COST_SP } from '../../constants';
import { BotContext } from '../../interfaces';
import { PremiumScreen } from '../screens/premium.screen';
import { NavigationService } from '../services/navigation.service';
import {
  RegisterCommandsDeps,
  safeAnswerCallbackQuery,
  renderScreen,
  getLocaleCode,
  ensurePremiumDefaults,
} from '../utils';

export function registerPremiumHandlers(
  bot: Bot<BotContext>,
  deps: RegisterCommandsDeps,
) {
  const premiumScreen = new PremiumScreen(deps);
  const navigation = new NavigationService(deps);
  const { t, setupAppService, subscriptionService } = deps;

  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data === 'profile:premium') {
      ctx.session.uiStack = ctx.session.uiStack || [];
      if (!ctx.session.currentRoute) {
        const userId = String(ctx.from?.id);
        let model = await deps.redisService.get<string>(`chat:${userId}:model`);
        if (!model) model = 'openai/gpt-4o-mini';
        ctx.session.currentRoute = {
          route: 'model_connected',
          params: { model },
        } as any;
      }
      await navigation.navigateTo(ctx, 'premium');
      return;
    }

    if (data === 'premium:activate') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.reply(t(ctx, 'unexpected_error'));
        return;
      }
      try {
        const alreadyActive = await subscriptionService.hasActiveSubscription(
          String(telegramId),
        );
        if (alreadyActive) {
          const { text, keyboard } = await premiumScreen.buildActive(ctx);
          await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
          return;
        }
        ctx.session.uiStack = ctx.session.uiStack || [];
        if (ctx.session.currentRoute) {
          ctx.session.uiStack.push(ctx.session.currentRoute);
        }
        const keyboard = new InlineKeyboard()
          .text(t(ctx, 'premium_confirm_yes'), 'premium:confirm_buy')
          .row()
          .text(t(ctx, 'premium_confirm_no'), 'premium:cancel_buy');
        try {
          await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
        } catch {
          try {
            await ctx.deleteMessage();
          } catch {}
          await ctx.reply('💎', { reply_markup: keyboard });
        }
      } catch (error) {
        console.error('premium:activate confirm prepare failed', error);
        await ctx.reply(t(ctx, 'unexpected_error'));
      }
      return;
    }

    if (data === 'premium:cancel_buy') {
      ctx.session.currentRoute = { route: 'premium' } as any;
      const screen = await premiumScreen.build(ctx);
      await renderScreen(ctx, screen);
      return;
    }

    if (data === 'premium:confirm_buy') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = ctx.from?.id;
      try {
        const alreadyActive = await subscriptionService.hasActiveSubscription(
          String(telegramId),
        );
        if (alreadyActive) {
          const { text, keyboard } = await premiumScreen.buildActive(ctx);
          await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
          return;
        }
        const hasEnough = await setupAppService.have(
          telegramId,
          PREMIUM_SUBSCRIPTION_COST_SP,
        );
        if (!hasEnough) {
          const currentBalance = await setupAppService.getBalance(telegramId);
          const keyboard = new InlineKeyboard().text(
            t(ctx, 'topup_sp_button'),
            'billing:topup',
          );
          await ctx.reply(
            t(ctx, 'premium_insufficient_sp', { balance: currentBalance }),
            { reply_markup: keyboard, parse_mode: 'HTML' },
          );
          return;
        }
        await subscriptionService.chargeAndCreateSubscription(
          telegramId,
          PREMIUM_SUBSCRIPTION_COST_SP,
          'Подписка "Premium" 10 SP на Multimodal bot',
          { periodDays: 30, autoRenew: false },
        );
        const keyboard = new InlineKeyboard()
          .text(
            t(ctx, 'premium_enable_autorenew_button'),
            'premium:enable_autorenew',
          )
          .row()
          .text(t(ctx, 'premium_later_button'), 'profile:back');
        await ctx.reply(t(ctx, 'premium_activated_success'), {
          reply_markup: keyboard,
        });
      } catch (error: any) {
        const message = String(error?.message || '');
        if (message.includes('INSUFFICIENT_FUNDS')) {
          const currentBalance = await setupAppService.getBalance(telegramId);
          const keyboard = new InlineKeyboard().text(
            t(ctx, 'topup_sp_button'),
            'billing:topup',
          );
          await ctx.reply(
            t(ctx, 'premium_insufficient_sp', { balance: currentBalance }),
            { reply_markup: keyboard, parse_mode: 'HTML' },
          );
        } else if (message.includes('ALREADY_HAS_ACTIVE_SUBSCRIPTION')) {
          const { text, keyboard } = await premiumScreen.buildActive(ctx);
          await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
        } else {
          console.error('premium:confirm_buy failed', error);
          await ctx.reply(t(ctx, 'unexpected_error'));
        }
      }
      return;
    }

    if (data === 'premium:back') {
      await navigation.navigateBack(ctx);
      return;
    }

    if (data === 'premium:enable_autorenew') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = String(ctx.from?.id);
      const updated = await subscriptionService.setAutoRenew(telegramId, true);
      const locale = getLocaleCode(ctx);
      let expiresAt = '';
      if (updated?.periodEnd) {
        const expires = new Date(updated.periodEnd);
        expiresAt = expires
          .toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          .replace(/[\u2068\u2069]/g, '');
      }
      const msg = t(ctx, 'premium_autorenew_enabled', {
        expires_at: expiresAt,
      }).replace(/\\n/g, '\n');
      try {
        await ctx.editMessageText(msg);
      } catch {
        try {
          await ctx.deleteMessage();
        } catch {}
        await ctx.reply(msg);
      }
      return;
    }

    if (data === 'premium:toggle_autorenew') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = String(ctx.from?.id);
      const activeSub =
        await subscriptionService.getActiveSubscription(telegramId);
      const current = Boolean(activeSub?.autoRenew);
      const targetEnable = !current;
      const locale = getLocaleCode(ctx);
      const expiresAt = activeSub?.periodEnd
        ? new Date(activeSub.periodEnd)
            .toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            .replace(/[\u2068\u2069]/g, '')
        : '';
      const confirmText = targetEnable
        ? t(ctx, 'premium_autorenew_confirm_enable', {
            expires_at: expiresAt,
          }).replace(/\\n/g, '\n')
        : t(ctx, 'premium_autorenew_confirm_disable', {
            expires_at: expiresAt,
          }).replace(/\\n/g, '\n');
      const kb = new InlineKeyboard()
        .text(
          t(ctx, 'premium_autorenew_confirm_yes'),
          targetEnable
            ? 'premium:autorenew:set_on'
            : 'premium:autorenew:set_off',
        )
        .row()
        .text(
          t(ctx, 'premium_autorenew_confirm_no'),
          'premium:autorenew:cancel',
        );
      await renderScreen(ctx, {
        text: confirmText,
        keyboard: kb,
        parse_mode: 'HTML',
      });
      return;
    }

    if (data === 'premium:autorenew:set_on') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = String(ctx.from?.id);
      await subscriptionService.setAutoRenew(telegramId, true);
      const { text, keyboard } = await premiumScreen.buildActive(ctx);
      try {
        await ctx.editMessageText(text, {
          reply_markup: keyboard,
          parse_mode: 'HTML',
        });
      } catch {
        try {
          await ctx.deleteMessage();
        } catch {}
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
      }
      return;
    }

    if (data === 'premium:autorenew:set_off') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = String(ctx.from?.id);
      await subscriptionService.setAutoRenew(telegramId, false);
      const { text, keyboard } = await premiumScreen.buildActive(ctx);
      try {
        await ctx.editMessageText(text, {
          reply_markup: keyboard,
          parse_mode: 'HTML',
        });
      } catch {
        try {
          await ctx.deleteMessage();
        } catch {}
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
      }
      return;
    }

    if (data === 'premium:autorenew:cancel') {
      await safeAnswerCallbackQuery(ctx);
      const { text, keyboard } = await premiumScreen.buildActive(ctx);
      try {
        await ctx.editMessageText(text, {
          reply_markup: keyboard,
          parse_mode: 'HTML',
        });
      } catch {
        try {
          await ctx.deleteMessage();
        } catch {}
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
      }
      return;
    }

    if (data === 'premium:extend') {
      await safeAnswerCallbackQuery(ctx);
      const telegramId = ctx.from?.id;
      const hasEnough = await setupAppService.have(
        telegramId,
        PREMIUM_SUBSCRIPTION_COST_SP,
      );
      if (!hasEnough) {
        const currentBalance = await setupAppService.getBalance(telegramId);
        const keyboard = new InlineKeyboard().text(
          t(ctx, 'topup_sp_button'),
          'wallet:topup',
        );
        await ctx.reply(
          t(ctx, 'premium_insufficient_sp', { balance: currentBalance }),
          { reply_markup: keyboard, parse_mode: 'HTML' },
        );
        return;
      }
      ensurePremiumDefaults(ctx);
      const current = new Date(ctx.session.premiumExpiresAt as string);
      const extended = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000);
      ctx.session.premiumExpiresAt = extended.toISOString();
      const { text, keyboard } = await premiumScreen.buildActive(ctx);
      try {
        await ctx.editMessageText(text, {
          reply_markup: keyboard,
          parse_mode: 'HTML',
        });
      } catch {
        try {
          await ctx.deleteMessage();
        } catch {}
        await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
      }
      return;
    }

    return next();
  });
}

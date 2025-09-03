import { Bot, InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { NavigationService } from '../services/navigation.service';
import {
  RegisterCommandsDeps,
  buildHelpText,
  safeAnswerCallbackQuery,
} from '../utils';

export function registerNavigationHandlers(
  bot: Bot<BotContext>,
  deps: RegisterCommandsDeps,
) {
  const navigation = new NavigationService(deps);
  const { t, subscriptionService } = deps;

  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data === 'menu_help') {
      await safeAnswerCallbackQuery(ctx);
      ctx.session.uiStack = ctx.session.uiStack || [];
      if (ctx.session.currentRoute) {
        ctx.session.uiStack.push(ctx.session.currentRoute);
      }
      ctx.session.currentRoute = { route: 'help' as any };
      const userId = String(ctx.from?.id);
      const hasActive = await subscriptionService.hasActiveSubscription(userId);
      const keyboard = new InlineKeyboard();
      if (hasActive) {
        keyboard.url(
          t(ctx, 'help_contact_support_button'),
          'https://t.me/setupmultisupport_bot',
        );
      } else {
        keyboard.text(t(ctx, 'help_contact_support_button'), 'help:support');
      }
      await ctx.reply(buildHelpText(ctx, t), { reply_markup: keyboard });
      return;
    }
    if (data === 'help:support') {
      await safeAnswerCallbackQuery(ctx);
      const userId = String(ctx.from?.id);
      const hasActive = await subscriptionService.hasActiveSubscription(userId);
      if (!hasActive) {
        const kb = new InlineKeyboard().text(
          t(ctx, 'model_buy_premium_button'),
          'profile:premium',
        );
        await ctx.reply(t(ctx, 'support_premium_required'), {
          reply_markup: kb,
        });
        return;
      }
      const kb = new InlineKeyboard().url(
        t(ctx, 'help_contact_support_button'),
        'https://t.me/setupmultisupport_bot',
      );
      await ctx.reply(t(ctx, 'help_contact_support_button'), {
        reply_markup: kb,
      });
      return;
    }
    if (data === 'menu_profile') {
      ctx.session.uiStack = ctx.session.uiStack || [];
      if (ctx.session.currentRoute) {
        ctx.session.uiStack.push(ctx.session.currentRoute);
      }
      ctx.session.currentRoute = { route: 'profile' as any };
      const screen = await navigation.buildRouteScreen(ctx, 'profile');
      await safeAnswerCallbackQuery(ctx);
      await ctx.reply(screen.text, {
        reply_markup: screen.keyboard,
        parse_mode: screen.parse_mode,
      });
      return;
    }
    if (data === 'ui:back') {
      await navigation.navigateBack(ctx);
      return;
    }
    return next();
  });
}

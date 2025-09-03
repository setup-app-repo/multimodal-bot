import { Bot, InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { ProfileScreen } from '../screens/profile.screen';
import { NavigationService } from '../services/navigation.service';
import {
  RegisterCommandsDeps,
  KeyboardBuilder,
  safeAnswerCallbackQuery,
} from '../utils';

export function registerProfileHandlers(
  bot: Bot<BotContext>,
  deps: RegisterCommandsDeps,
) {
  const profileScreen = new ProfileScreen(deps);
  const navigation = new NavigationService(deps);
  const { t } = deps;

  bot.command('profile', async (ctx) => {
    const screen = await profileScreen.build(ctx);
    await ctx.reply(screen.text, {
      reply_markup: screen.keyboard,
      parse_mode: screen.parse_mode,
    });
  });

  bot.command('language', async (ctx) => {
    await ctx.reply(t(ctx, 'choose_language'), {
      reply_markup: KeyboardBuilder.buildLanguageInlineKeyboard(ctx, t),
    });
  });

  bot.command('clear', async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text(t(ctx, 'clear_yes_button'), 'clear:confirm')
      .row()
      .text(t(ctx, 'back_button'), 'profile:back');
    await ctx.reply(t(ctx, 'clear_confirm'), {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data === 'profile_language') {
      await navigation.navigateTo(ctx, 'profile_language');
      return;
    }
    if (data === 'profile_clear') {
      await navigation.navigateTo(ctx, 'profile_clear');
      return;
    }
    if (data === 'clear:confirm') {
      await safeAnswerCallbackQuery(ctx);
      const userId = String(ctx.from?.id);
      await deps.redisService.clearHistory(userId);
      try {
        await ctx.deleteMessage();
      } catch {}
      await ctx.reply(t(ctx, 'context_cleared'), { parse_mode: 'Markdown' });
      return;
    }
    if (data === 'clear:cancel' || data === 'profile:back') {
      await navigation.navigateBack(ctx);
      return;
    }
    return next();
  });
}

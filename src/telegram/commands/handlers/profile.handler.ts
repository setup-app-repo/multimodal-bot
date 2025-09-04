import { Bot, InlineKeyboard } from 'grammy';
import { AppType } from '@setup-app-repo/setup.app-sdk';

import { BotContext } from '../../interfaces';
import { ProfileScreen } from '../screens/profile.screen';
import { NavigationService } from '../services/navigation.service';
import { RegisterCommandsDeps, KeyboardBuilder, safeAnswerCallbackQuery } from '../utils';

export function registerProfileHandlers(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
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
    // Handle language selection
    if (data.startsWith('lang_')) {
      const userId = String(ctx.from?.id);
      const code = data.replace('lang_', '');
      const map: Record<string, string> = { en: 'en', ru: 'ru', es: 'es', de: 'de', pt: 'pt', fr: 'fr' };
      const locale = map[code] || 'en';

      // Persist and switch session locale
      ctx.session.lang = locale;
      await deps.redisService.set(`chat:${userId}:lang`, locale);

      // Update Telegram menu button locale via Setup.app (if available)
      try {
        if (deps.setupAppService.isInitialized()) {
          const currentLang = ctx.session.lang || deps.i18n.getDefaultLocale();
          await deps.setupAppService.setupMenuButton(ctx as any, {
            language: currentLang,
            appType: AppType.DEFAULT,
          });
        }
      } catch { }

      // Show confirmation toast in the new locale
      const languageKeyByCode: Record<string, string> = {
        en: 'language_english',
        ru: 'language_russian',
        es: 'language_spanish',
        de: 'language_german',
        pt: 'language_portuguese',
        fr: 'language_french',
      };
      const languageLabel = deps.i18n.t(languageKeyByCode[locale] || 'language_english', ctx.session.lang);
      await safeAnswerCallbackQuery(ctx, { text: t(ctx, 'language_switched', { language: languageLabel }) });

      // Also send a regular message to refresh reply keyboard (localized)
      try {
        const switchedText = t(ctx, 'language_switched', { language: languageLabel });
        await ctx.reply(switchedText, {
          reply_markup: KeyboardBuilder.buildMainReplyKeyboard(ctx, t),
        });
      } catch { }

      // Do not navigate back to profile; just clean up the language selection message
      try {
        await ctx.deleteMessage();
      } catch { }
      return;
    }
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
      } catch { }
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

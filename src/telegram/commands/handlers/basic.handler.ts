import { AppType } from '@setup-app-repo/setup.app-sdk';
import { Bot, InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { RegisterCommandsDeps, KeyboardBuilder, buildHelpText } from '../utils';

export function registerBasicHandlers(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
  const { t, i18n, setupAppService, userService, redisService, subscriptionService } = deps;

  bot.command('help', async (ctx) => {
    const userId = String(ctx.from?.id);
    const hasActive = await subscriptionService.hasActiveSubscription(userId);
    const keyboard = new InlineKeyboard();
    if (hasActive) {
      keyboard.url(t(ctx, 'help_contact_support_button'), 'https://t.me/setupmultisupport_bot');
    } else {
      keyboard.text(t(ctx, 'help_contact_support_button'), 'help:support');
    }
    await ctx.reply(buildHelpText(ctx, t), { reply_markup: keyboard });
  });

  bot.command('billing', async (ctx) => {
    await ctx.reply(t(ctx, 'billing_coming_soon'));
  });

  bot.command('start', async (ctx) => {
    if (ctx.from?.id) {
      try {
        const telegramId = ctx.from?.id;
        // Обрабатываем реферал: /start <referralId>
        const referralId = ctx.match && typeof ctx.match === 'string' ? Number(ctx.match) : undefined;
        if (!referralId) {
          await setupAppService.auth(telegramId, {
            firstName: ctx.from?.first_name || '',
            lastName: ctx.from?.last_name || '',
            username: ctx.from?.username || '',
          });
        } else {
          try {
            const userData = {
              firstName: ctx.from?.first_name || '',
              lastName: ctx.from?.last_name || '',
              username: ctx.from?.username || '',
            };
            const result = await setupAppService.setReferral(telegramId, referralId, userData);
            this.logger.log(` ✅ Referral set successfully`, {
              telegramId,
              referralId: result.referral
            });
            const curatorId = String(referralId);
            // Сообщение пользователю, который перешёл по ссылке
            try {
              await ctx.reply(
                `✅ Поздравляем, ваш куратор в системе Setup — ID ${curatorId}`,
                { parse_mode: 'HTML' },
              );
            } catch { }
          } catch (error: any) {
            console.error('Ошибка работы с рефералами:', error);
            await ctx.reply(error?.message || '❌ Ошибка при работе с реферальной программой');
          }
        }

        await userService.findOrCreateUser(String(telegramId), {
          telegramId: String(telegramId),
          username: ctx.from.username,
          firstName: ctx.from.first_name || 'User',
          lastName: ctx.from.last_name,
          languageCode: ctx.from.language_code,
          isPremium: ctx.from.is_premium || false,
        });
        console.debug(`User ensured in DB: ${telegramId}`);
      } catch (e) {
        console.error('Error ensuring user in DB on /start:', e);
      }
    }
    const userId = String(ctx.from?.id);
    const savedLang = await redisService.get<string>(`chat:${userId}:lang`);

    if (!savedLang) {
      const profileLangCode = ctx.from?.language_code;
      const initialLang =
        profileLangCode && i18n.isLocaleSupported(profileLangCode) ? profileLangCode : 'ru';
      ctx.session.lang = initialLang;
      await ctx.reply(t(ctx, 'start_language_welcome'), {
        reply_markup: KeyboardBuilder.buildLanguageInlineKeyboard(ctx, t),
      });
      return;
    }

    ctx.session.lang = ctx.session.lang || savedLang;
    const promoTextStart = t(ctx, 'onboarding_promo', {
      first_name: ctx.from?.first_name || ctx.from?.username || '',
    });
    const promoTextStartMd = promoTextStart.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/\\n/g, '\n');
    const telegramId = ctx.from?.id as number;
    const referralCode = ctx?.match && typeof ctx.match === 'string' ? ctx.match : undefined;

    try {
      if (setupAppService.isInitialized()) {
        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        await setupAppService.setupMenuButton(ctx as any, {
          language: currentLang,
          appType: AppType.DEFAULT,
        });
      }
    } catch { }

    await ctx.reply(promoTextStartMd, {
      reply_markup: KeyboardBuilder.buildMainReplyKeyboard(ctx, t),
      parse_mode: 'Markdown',
    });
  });
}

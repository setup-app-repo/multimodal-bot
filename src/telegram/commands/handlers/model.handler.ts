import { Bot } from 'grammy';

import { models } from '../../constants';
import { BotContext } from '../../interfaces';
import { ModelScreen } from '../screens/model.screen';
import { NavigationService } from '../services/navigation.service';
import { RegisterCommandsDeps, safeAnswerCallbackQuery } from '../utils';
import { sendMessageWithRetry } from 'src/telegram/utils';

export function registerModelHandlers(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
  const modelScreen = new ModelScreen(deps);
  const navigation = new NavigationService(deps);
  const { t, redisService } = deps;

  bot.command('model', async (ctx) => {
    const { text, keyboard, parse_mode } = await modelScreen.buildSelectionKeyboard(ctx);
    await sendMessageWithRetry(ctx.api as any, ctx.chat!.id, text, { reply_markup: keyboard, parse_mode });
  });

  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith('model_')) {
      const selectedModel = data.replace('model_', '');
      if (!models.includes(selectedModel)) {
        await safeAnswerCallbackQuery(ctx, {
          text: t(ctx, 'invalid_model'),
          show_alert: true,
        });
        return;
      }
      await redisService.set(`chat:${String(ctx.from?.id)}:model`, selectedModel, 7 * 24 * 60 * 60);
      // Чистим последний медиа‑контекст при смене модели
      try {
        await redisService.del(`chat:${String(ctx.from?.id)}:lastImageDataUrl`);
      } catch { }
      await safeAnswerCallbackQuery(ctx);
      await navigation.navigateTo(ctx, 'model_connected', {
        model: selectedModel,
      });
      return;
    }
    if (data === 'model:back') {
      await safeAnswerCallbackQuery(ctx);
      const { text, keyboard, parse_mode } = await modelScreen.buildSelectionKeyboard(ctx);
      await sendMessageWithRetry(ctx.api as any, ctx.chat!.id, text, { reply_markup: keyboard, parse_mode });
      return;
    }
    if (data === 'menu_model') {
      await safeAnswerCallbackQuery(ctx);
      const { text, keyboard, parse_mode } = await modelScreen.buildSelectionKeyboard(ctx);
      await sendMessageWithRetry(ctx.api as any, ctx.chat!.id, text, { reply_markup: keyboard, parse_mode });
      return;
    }
    if (data === 'model:close') {
      await safeAnswerCallbackQuery(ctx);
      try {
        await ctx.deleteMessage();
      } catch {
        try { await ctx.editMessageReplyMarkup(); } catch { }
      }
      return;
    }
    return next();
  });
}

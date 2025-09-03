import { Bot } from 'grammy';

import { models } from '../../constants';
import { BotContext } from '../../interfaces';
import { ModelScreen } from '../screens/model.screen';
import { NavigationService } from '../services/navigation.service';
import { RegisterCommandsDeps, safeAnswerCallbackQuery } from '../utils';

export function registerModelHandlers(
  bot: Bot<BotContext>,
  deps: RegisterCommandsDeps,
) {
  const modelScreen = new ModelScreen(deps);
  const navigation = new NavigationService(deps);
  const { t, redisService } = deps;

  bot.command('model', async (ctx) => {
    const { text, keyboard } = await modelScreen.buildSelectionKeyboard(ctx);
    await ctx.reply(text, { reply_markup: keyboard });
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
      await redisService.set(
        `chat:${String(ctx.from?.id)}:model`,
        selectedModel,
        60 * 60,
      );
      await safeAnswerCallbackQuery(ctx);
      await navigation.navigateTo(ctx, 'model_connected', {
        model: selectedModel,
      });
      return;
    }
    if (data === 'model:close') {
      await safeAnswerCallbackQuery(ctx);
      try {
        await ctx.deleteMessage();
      } catch {}
      return;
    }
    if (data === 'menu_model') {
      await safeAnswerCallbackQuery(ctx);
      const { text, keyboard } = await modelScreen.buildSelectionKeyboard(ctx);
      await ctx.reply(text, { reply_markup: keyboard });
      return;
    }
    return next();
  });
}

import { Bot, InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';
import { ModelScreen } from '../screens/model.screen';
import { NavigationService } from '../services/navigation.service';
import { RegisterCommandsDeps, buildHelpText } from '../utils';

export function registerReplyHandlers(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
  const { t, i18n, subscriptionService } = deps;
  const navigation = new NavigationService(deps);
  const modelScreen = new ModelScreen(deps);

  const getAllLocaleLabels = (key: string): string[] => {
    return deps.i18n.getSupportedLocales().map((loc) => deps.i18n.t(key, loc));
  };

  const detectReplyAction = (text: string): 'help' | 'profile' | 'model' | null => {
    if (getAllLocaleLabels('help_button').includes(text)) return 'help';
    if (getAllLocaleLabels('profile_button').includes(text)) return 'profile';
    if (getAllLocaleLabels('model_selection_button').includes(text)) return 'model';
    return null;
  };

  bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text;
    const action = detectReplyAction(text);

    if (action === 'help') {
      const userId = String(ctx.from?.id);
      const hasActive = await subscriptionService.hasActiveSubscription(userId);
      const keyboard = new InlineKeyboard();
      if (hasActive) {
        keyboard.url(t(ctx, 'help_contact_support_button'), 'https://t.me/setupmultisupport_bot');
      } else {
        keyboard.text(t(ctx, 'help_contact_support_button'), 'help:support');
      }
      await ctx.reply(buildHelpText(ctx, t), { reply_markup: keyboard });
      return;
    }
    if (action === 'profile') {
      await navigation.navigateTo(ctx, 'profile');
      return;
    }
    if (action === 'model') {
      const { text, keyboard } = await modelScreen.buildSelectionKeyboard(ctx);
      await ctx.reply(text, { reply_markup: keyboard });
      return;
    }
    return next();
  });
}

import { Bot } from 'grammy';

import { BotContext } from '../interfaces';

import {
  registerReplyHandlers,
  registerNavigationHandlers,
  registerPremiumHandlers,
  registerModelHandlers,
  registerBasicHandlers,
  registerProfileHandlers,
} from './handlers';
import { RegisterCommandsDeps } from './utils';

export function registerCommands(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
  const { userService } = deps;

  bot.use(async (ctx, next) => {
    try {
      if (ctx.message && ctx.from?.id) {
        await userService.updateUser(String(ctx.from.id));
      }
    } catch { }
    return next();
  });

  registerBasicHandlers(bot, deps);
  registerProfileHandlers(bot, deps);
  registerModelHandlers(bot, deps);
  registerPremiumHandlers(bot, deps);
  registerNavigationHandlers(bot, deps);
  registerReplyHandlers(bot, deps);
}

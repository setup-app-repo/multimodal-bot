import { Bot } from 'grammy';
import { BotContext } from '../interfaces';
import { RegisterCommandsDeps } from './utils';
import { 
    registerReplyHandlers, 
    registerNavigationHandlers,
    registerPremiumHandlers,
    registerModelHandlers, 
    registerBasicHandlers, 
    registerProfileHandlers 
} from './handlers';

export function registerCommands(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
    const { userService } = deps;

    bot.use(async (ctx, next) => {
        try {
            if (ctx.message && ctx.from?.id) {
                await userService.updateUser(String(ctx.from.id));
            }
        } catch {}
        return next();
    });

    registerBasicHandlers(bot, deps);
    registerProfileHandlers(bot, deps);
    registerModelHandlers(bot, deps);
    registerPremiumHandlers(bot, deps);
    registerNavigationHandlers(bot, deps);
    registerReplyHandlers(bot, deps);
}



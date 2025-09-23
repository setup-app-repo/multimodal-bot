import { I18nService } from 'src/i18n/i18n.service';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';
import { UserService } from 'src/user/user.service';
import { BotContext } from '../interfaces';

export function createBlockedGuardMiddleware(deps: {
    userService: UserService;
    i18n: I18nService;
    logger?: WinstonLoggerService;
}) {
    const { userService, logger } = deps;
    return async (ctx: BotContext, next: () => Promise<void>) => {
        const userId = ctx.from?.id ? String(ctx.from.id) : undefined;
        if (!userId) return next();

        try {
            const blocked = await userService.isBlocked(userId);
            if (blocked) {
                console.log('User is blocked, return :))');
                return;
            }
        } catch (e) {
            logger?.warn?.('Blocked guard check failed', e as any);
        }

        await next();
    };
}



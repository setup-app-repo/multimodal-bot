import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';

export function createLanguageMiddleware(deps: { i18n: I18nService; redisService: RedisService; logger?: { warn: (...args: any[]) => void } }) {
    const { i18n, redisService, logger } = deps;
    return async (ctx: BotContext, next: () => Promise<void>) => {
        try {
            if (!ctx.session.lang) {
                const userId = ctx.from?.id ? String(ctx.from.id) : undefined;
                const savedLang = userId ? await redisService.get<string>(`chat:${userId}:lang`) : undefined;
                ctx.session.lang = savedLang || i18n.getDefaultLocale();
            }
        } catch (e) {
            // Не блокируем обработку апдейта
            logger?.warn?.('Language init middleware error', e as any);
        }
        await next();
    };
}



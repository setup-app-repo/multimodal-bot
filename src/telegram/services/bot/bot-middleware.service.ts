import { Injectable, Logger } from '@nestjs/common';
import { session } from 'grammy';

import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext, SessionData } from 'src/telegram/interfaces';
import { createLanguageMiddleware } from 'src/telegram/middlewares/language.middleware';
import { Bot } from 'grammy';

@Injectable()
export class BotMiddlewareService {
    private readonly logger = new Logger(BotMiddlewareService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
    ) { }

    setupAll(bot: Bot<BotContext>): void {
        this.setupSession(bot);
        this.setupLanguage(bot);
    }

    setupSession(bot: Bot<BotContext>): void {
        bot.use(
            session<SessionData, BotContext>({
                initial: (): SessionData => ({}),
                getSessionKey: (ctx) => ctx.from?.id?.toString() || 'anonymous',
            }),
        );
    }

    setupLanguage(bot: Bot<BotContext>): void {
        bot.use(
            createLanguageMiddleware({
                i18n: this.i18n,
                redisService: this.redisService,
                logger: this.logger,
            }),
        );
    }
}



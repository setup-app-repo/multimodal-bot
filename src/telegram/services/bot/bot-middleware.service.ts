import { Injectable } from '@nestjs/common';
import { session } from 'grammy';

import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext, SessionData } from 'src/telegram/interfaces';
import { createLanguageMiddleware } from 'src/telegram/middlewares/language.middleware';
import { Bot } from 'grammy';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';
import { createBlockedGuardMiddleware } from 'src/telegram/middlewares/blocked.middleware';
import { UserService } from 'src/user/user.service';

@Injectable()
export class BotMiddlewareService {
    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly logger: WinstonLoggerService,
        private readonly userService: UserService,
    ) { }

    setupAll(bot: Bot<BotContext>): void {
        this.setupSession(bot);
        this.setupLanguage(bot);
        this.setupBlockedGuard(bot);
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

    setupBlockedGuard(bot: Bot<BotContext>): void {
        bot.use(
            createBlockedGuardMiddleware({
                userService: this.userService,
                i18n: this.i18n,
                logger: this.logger,
            }),
        );
    }
}



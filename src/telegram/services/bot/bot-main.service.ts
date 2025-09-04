import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UserService } from 'src/user/user.service';
import { BotInstanceService } from './bot-instance.service';
import { BotMiddlewareService } from './bot-middleware.service';
import { BotWebhookService } from './bot-webhook.service';
import { BotHandlerRegistrationService } from './bot-handler-registration.service';
import { TranslateFn } from 'src/telegram/commands/utils/types';
import { BotContext } from 'src/telegram/interfaces';

@Injectable()
export class BotMainService implements OnModuleInit {
    private readonly logger = new Logger(BotMainService.name);

    constructor(
        private readonly botInstance: BotInstanceService,
        private readonly middleware: BotMiddlewareService,
        private readonly webhook: BotWebhookService,
        private readonly handlers: BotHandlerRegistrationService,

        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly setupAppService: SetupAppService,
        private readonly userService: UserService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    async onModuleInit(): Promise<void> {
        this.logger.log('Initializing BotMainService...');
        const bot = this.botInstance.createBot();

        this.middleware.setupAll(bot);
        this.handlers.registerAll(bot, this.createDeps());

        await bot.init();
        await this.webhook.setupWebhook(bot);
        this.logger.log('BotMainService initialized');
    }

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = (ctx.session && ctx.session.lang) || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    private createDeps() {
        const t: TranslateFn = (ctx, key, args) => this.t(ctx, key, args);
        return {
            t,
            i18n: this.i18n,
            redisService: this.redisService,
            setupAppService: this.setupAppService,
            userService: this.userService,
            subscriptionService: this.subscriptionService,
        };
    }

    async handleWebhookUpdate(update: any): Promise<void> {
        const bot = this.botInstance.getBot();
        await this.webhook.handleWebhookUpdate(bot, update);
    }
}



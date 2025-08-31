import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, session } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { SetupAppService } from 'src/setup-app/setup-app.service';

import { RedisService } from 'src/redis/redis.service';
import { I18nService } from 'src/i18n/i18n.service';
import { UserService } from 'src/user/user.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

import { BotContext, SessionData } from '../interfaces';
import { registerCommands } from '../commands';
import { MessageHandlerService } from './message-handler.service';
import { DocumentHandlerService } from './document-handler.service';
import { createLanguageMiddleware } from '../middlewares/language.middleware';

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
    private bot: Bot<BotContext> | null = null;

    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nService,
        private readonly setupAppService: SetupAppService,
        private readonly userService: UserService,
        private readonly subscriptionService: SubscriptionService,
        private readonly messageHandler: MessageHandlerService,
        private readonly documentHandler: DocumentHandlerService,
    ) {}

    async onModuleInit() {
        this.logger.log('Initializing BotService...');
        this.initializeBot();
        await this.setupBot();
        this.logger.log('BotService initialized successfully');
    }
    

    private initializeBot() {
        const token = this.configService.get<string>('BOT_TOKEN');
        
        if (!token) {
          this.logger.error('BOT_TOKEN is required');
          throw new Error('BOT_TOKEN is required');
        }
    
        this.logger.log('Initializing bot with token...');
        this.bot = new Bot<BotContext>(token);

    
        // // Session middleware для Grammy conversations (в памяти)
        this.bot.use(
          session<SessionData, BotContext>({
            initial: (): SessionData => ({}),
            getSessionKey: (ctx) => ctx.from?.id?.toString() || 'anonymous',
          }),
        );

        // Глобальный middleware для инициализации языка пользователя
        this.bot.use(createLanguageMiddleware({ i18n: this.i18n, redisService: this.redisService, logger: this.logger }));
      }

      private async setupBot() {
        if (!this.bot) {
            this.logger.error('Bot is not initialized');
            throw new Error('Bot is not initialized');
        }

        this.logger.log('Setting up bot handlers...');

        registerCommands(this.bot, {
            t: (ctx, key, args) => this.t(ctx, key, args),
            i18n: this.i18n,
            redisService: this.redisService,
            setupAppService: this.setupAppService,
            userService: this.userService,
            subscriptionService: this.subscriptionService,
        });

        this.bot.on('message:text', (ctx) => this.messageHandler.handleText(ctx));
        this.bot.on('message:document', (ctx) => this.documentHandler.handleDocument(ctx));
        this.bot.catch((err) => this.messageHandler.handleError(err));

        
        await this.bot.init();
        
        await this.setupWebhook();
    }

    /**
     * Обработка webhook update от Telegram
     */
    async handleWebhookUpdate(update: any) {
        if (!this.bot) {
            throw new Error('Bot is not initialized');
        }
        
        try {
            await this.bot.handleUpdate(update);
        } catch (error) {
            this.logger.error('Error handling webhook update:', error);
            throw error;
        }
    }

    /**
     * Установка вебхука для получения обновлений от Telegram
     */
    private async setupWebhook() {
        if (!this.bot) {
            this.logger.error('Bot is not initialized, cannot setup webhook');
            return;
        }

        const webhookUrl = `${this.configService.get<string>('TELEGRAM_WEBHOOK_URL')}/telegram/webhook/${this.configService.get<string>('TELEGRAM_SECRET_KEY')}`;
        
        if (!webhookUrl) {
            this.logger.warn('TELEGRAM_WEBHOOK_URL не задан, вебхук не будет установлен. Бот будет работать в режиме polling.');
            return;
        }
        
        try {
            const result = await this.bot.api.setWebhook(webhookUrl);
            
            if (result) {
                this.logger.log(`✅ Вебхук успешно установлен: ${webhookUrl}`);
                
                const webhookInfo = await this.bot.api.getWebhookInfo();
                this.logger.log('Информация о вебхуке:', {
                    url: webhookInfo.url,
                    hasCustomCertificate: webhookInfo.has_custom_certificate,
                    pendingUpdateCount: webhookInfo.pending_update_count,
                    lastErrorDate: webhookInfo.last_error_date,
                    lastErrorMessage: webhookInfo.last_error_message,
                });
            } else {
                this.logger.error('❌ Ошибка установки вебхука');
            }
        } catch (error) {
            this.logger.error('❌ Ошибка при установке вебхука:', error);
            this.logger.warn('Попробуйте установить вебхук вручную через Telegram Bot API');
        }
    }

    /**
     * Получить перевод с учетом языка из сессии пользователя
     */
    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }
}
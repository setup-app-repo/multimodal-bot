import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, session } from 'grammy';
import { ConfigService } from '@nestjs/config';
import { SetupAppService } from 'src/setup-app/setup-app.service';

import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';
import { I18nService } from 'src/i18n/i18n.service';
import { UserService } from 'src/user/user.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, MODELS_SUPPORTING_FILES, getPriceSP, MODEL_TO_TIER, ModelTier, DAILY_BASE_FREE_LIMIT } from '../constants';

import { BotContext, SessionData } from '../interfaces';
import { registerCommands } from '../commands';
import { getModelDisplayName } from '../utils/model-display';
import { escapeMarkdown, sendLongMessage } from '../utils/message';
import { TelegramFileService } from './telegram-file.service';
import { createLanguageMiddleware } from '../middlewares/language.middleware';

@Injectable()
export class BotService implements OnModuleInit {
    private readonly logger = new Logger(BotService.name);
    private bot: Bot<BotContext> | null = null;

    constructor(
        private readonly openRouterService: OpenRouterService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nService,
        private readonly setupAppService: SetupAppService,
        private readonly userService: UserService,
        private readonly subscriptionService: SubscriptionService,
        private readonly telegramFileService: TelegramFileService,
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

        this.bot.on("message:text", async (ctx) => {
            try {
              const text = ctx.message.text;
              
              // Пропускаем команды и кнопки клавиатуры
              if (text.startsWith('/')) {
                return;
              }
              
              // Проверяем, является ли это кнопкой клавиатуры (обрабатывается в commands)
              const helpButtonText = this.t(ctx, 'help_button');
              const profileButtonText = this.t(ctx, 'profile_button');  
              const modelSelectionButtonText = this.t(ctx, 'model_selection_button');
              if (text === helpButtonText || text === profileButtonText || text === modelSelectionButtonText) return;
              
              const userId = String(ctx.from?.id);
              const model = await this.redisService.get<string>(`chat:${userId}:model`);
              
              this.logger.log(`Processing text message from user ${userId}, model: ${model}`);
              
              if (!model) {
                this.logger.warn(`User ${userId} tried to send message without selecting model`);
                await ctx.reply(this.t(ctx, 'warning_select_model_first'));
                return;
              }
          
              await ctx.api.sendChatAction(ctx.chat.id, 'typing');
          
              await this.redisService.saveMessage(userId, 'user', text);
          
              const history = await this.redisService.getHistory(userId);

              let fileContent: string | undefined;
              try {
                fileContent = await this.telegramFileService.consumeLatestFileAndProcess(userId, ctx);
                if (fileContent) {
                  this.logger.log(`File processed successfully for user ${userId}, content length: ${fileContent.length} characters`);
                  await ctx.reply(this.t(ctx, 'file_analyzing'));
                }
              } catch (fileError) {
                this.logger.error(`Error processing file for user ${userId}:`, fileError);
                await ctx.reply(this.t(ctx, 'error_processing_file_retry'));
              }

              this.logger.log(`Sending request to OpenRouter for user ${userId}, model: ${model}, history length: ${history.length}, has file: ${!!fileContent}`);

              const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
              const price = getPriceSP(model, hasActiveSubscription);
              this.logger.log(`Will deduct ${price} SP for user ${userId} for model ${model}. hasActiveSubscription: ${hasActiveSubscription}`);

              const hasEnoughSP = await this.setupAppService.have(Number(userId), price);
              
              if (!hasEnoughSP) {
                const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
                if (!hasActiveSubscription && tier === ModelTier.BASE) {
                  // Разрешаем запрос для базовой модели без подписки даже при недостатке SP
                } else {
                  await ctx.reply(this.t(ctx, 'insufficient_funds'));
                  return;
                }
              }

              // Лимит 30 запросов/сутки для BASE без подписки
              const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
              if (!hasActiveSubscription && tier === ModelTier.BASE) {
                try {
                  const usedToday = await this.redisService.incrementDailyBaseCount(userId);
                  if (usedToday > DAILY_BASE_FREE_LIMIT) {
                    await ctx.reply(this.t(ctx, 'daily_limit_reached'));
                    return;
                  }
                } catch (limitError) {
                  this.logger.error(`Daily limit check failed for user ${userId}:`, limitError);
                  // В случае ошибки проверки лимита всё же не блокируем пользователя
                }
              }

              const answer = await this.openRouterService.ask(history, model, fileContent);

              const description = `Query to ${model}`;
              if (MODEL_TO_TIER[model] !== ModelTier.BASE) {
                await this.setupAppService.deduct(Number(userId), price, description);
              }

              this.logger.log(`Received response from OpenRouter for user ${userId}, response length: ${answer.length}`);
          
              await this.redisService.saveMessage(userId, 'assistant', answer);
          
              const modelDisplayName = getModelDisplayName(model);
              const modelInfo = ` 🤖 **${this.t(ctx, 'model')}:** ${modelDisplayName}\n\n`;
              
              const safeAnswer = escapeMarkdown(answer);
              await sendLongMessage(
                ctx,
                (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
                modelInfo + safeAnswer,
                { parse_mode: 'Markdown' }
              );
            } catch (error) {
              this.logger.error(`Error processing message from user ${String(ctx.from?.id)}:`, error);
              await ctx.reply(this.t(ctx, 'error_processing_message'));
            }
          });

        this.bot.on('message:document', async (ctx) => {
            try {
                const doc = ctx.message.document;
                const userId = String(ctx.from?.id);
                const model = await this.redisService.get<string>(`chat:${userId}:model`);

                this.logger.log(`Document received from user ${userId}: ${doc.file_name} (${doc.mime_type}, ${doc.file_size} bytes)`);

                if (!doc) return;

                const size = doc.file_size ?? 0;
                if (size > MAX_FILE_SIZE_BYTES) {
                    this.logger.warn(`User ${userId} tried to upload file ${doc.file_name} with size ${size} bytes (exceeds limit)`);
                    await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
                    return;
                }

                const mime = doc.mime_type || '';
                if (!ALLOWED_MIME_TYPES.has(mime)) {
                    this.logger.warn(`User ${userId} tried to upload unsupported file type: ${mime}`);
                    await ctx.reply(this.t(ctx, 'warning_unsupported_file_type'));
                    return;
                }

                if (!model) {
                    this.logger.warn(`User ${userId} tried to upload file without selecting model`);
                    await ctx.reply(this.t(ctx, 'warning_select_model_before_file'));
                    return;
                }

                if (!MODELS_SUPPORTING_FILES.has(model)) {
                    this.logger.warn(`User ${userId} tried to upload file with unsupported model: ${model}`);
                    await ctx.reply(this.t(ctx, 'warning_model_no_file_support'));
                    return;
                }

                // Сохраняем информацию о файле в Redis для последующего использования
                const fileInfo = {
                    fileId: doc.file_id,
                    fileName: doc.file_name,
                    mimeType: mime,
                    fileSize: size,
                    timestamp: Date.now()
                };
                
                await this.telegramFileService.saveFileMeta(userId, fileInfo, 60 * 60);
                
                this.logger.log(`File ${doc.file_name} saved for user ${userId}, fileId: ${doc.file_id}`);
                
                await ctx.reply(
                    `${this.t(ctx, 'file_accepted')}\n\n` +
                    `${this.t(ctx, 'file_name', { name: doc.file_name })}\n` +
                    `${this.t(ctx, 'file_size', { size: (size / 1024 / 1024).toFixed(2) })}\n` +
                    `${this.t(ctx, 'file_type', { type: mime })}`
                );
            } catch (error) {
                this.logger.error(`Error processing document from user ${String(ctx.from?.id)}:`, error);
                try { await ctx.reply(this.t(ctx, 'error_processing_file')); } catch {}
            }
        });
        
        this.bot.catch(async (err) => {
            this.logger.error('Unhandled bot error:', err);
            try {
                await err.ctx.reply(this.t(err.ctx, 'unexpected_error'));
            } catch {}
        });

        
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
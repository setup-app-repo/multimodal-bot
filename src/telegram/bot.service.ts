import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Bot, session } from 'grammy';
import { ConfigService } from '@nestjs/config';

import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';
import { I18nService } from 'src/i18n/i18n.service';

import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, MODELS_SUPPORTING_FILES } from './constants';
import { BotContext, SessionData } from './interfaces';
import { registerCommands } from './commands';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BotService.name);
    private bot: Bot<BotContext> | null = null;

    constructor(
        private readonly openRouterService: OpenRouterService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nService
    ) {}

    async onModuleInit() {
        this.logger.log('Initializing BotService...');
        this.initializeBot();
        await this.setupBot();
        this.logger.log('BotService initialized successfully');
    }

    async onModuleDestroy() {
        this.logger.log('Shutting down BotService...');
        if (this.bot) {
            try {
                this.bot.stop();
                this.logger.log('Bot stopped successfully');
            } catch (error) {
                this.logger.error('Error stopping bot:', error);
            }
        }
    }
    /**
     * Инициализировать сессию пользователя (устанавливает язык по умолчанию если не установлен)
     */
    private async initializeSession(ctx: BotContext): Promise<void> {
        if (!ctx.session) {
            ctx.session = {};
        }

        this.logger.log(`initializeSession: ${JSON.stringify(ctx.session)}`);
        
        if (!ctx.session.lang) {
            // Пытаемся получить язык из Redis для миграции
            const userId = String(ctx.from?.id);
            const savedLang = await this.redisService.get<string>(`chat:${userId}:lang`);
            
            ctx.session.lang = savedLang || this.i18n.getDefaultLocale();
            
            // Удаляем из Redis после миграции в сессию
            if (savedLang) {
                await this.redisService.del(`chat:${userId}:lang`);
            }
        }
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
      }

      private async setupBot() {
        if (!this.bot) {
            this.logger.error('Bot is not initialized');
            throw new Error('Bot is not initialized');
        }

        this.logger.log('Setting up bot commands and handlers...');
        await this.setMyCommands();

        registerCommands(this.bot, {
            initializeSession: (ctx) => this.initializeSession(ctx),
            t: (ctx, key, args) => this.t(ctx, key, args),
            i18n: this.i18n,
            redisService: this.redisService,
        });

        this.bot.on("message:text", async (ctx) => {
            try {
              await this.initializeSession(ctx);
              const text = ctx.message.text;
              
              // Пропускаем команды и кнопки клавиатуры
              if (text.startsWith('/')) {
                return;
              }
              
              // Проверяем, является ли это кнопкой клавиатуры
              const helpButtonText = this.t(ctx, 'help_button');
              const profileButtonText = this.t(ctx, 'profile_button');  
              const modelSelectionButtonText = this.t(ctx, 'model_selection_button');
              
              if (text === helpButtonText || text === profileButtonText || text === modelSelectionButtonText) {
                return;
              }
              
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
              const userFiles = await this.redisService.keys(`file:${userId}:*`);
              
              if (userFiles.length > 0) {
                this.logger.log(`Found ${userFiles.length} files for user ${userId}`);
                // Берем самый свежий файл
                const latestFileKey = userFiles[userFiles.length - 1];
                const fileInfoStr = await this.redisService.get<string>(latestFileKey);
                
                if (fileInfoStr) {
                  try {
                    const fileInfo = JSON.parse(fileInfoStr);
                    const fileId = fileInfo.fileId;
                    
                    this.logger.log(`Processing file ${fileInfo.fileName} (${fileInfo.mimeType}) for user ${userId}`);
                    
                    // Получаем файл через Telegram API
                    const file = await ctx.api.getFile(fileId);
                    if (file && file.file_path) {
                      // Скачиваем файл
                      const fileUrl = `https://api.telegram.org/file/bot${this.configService.get<string>('BOT_TOKEN')}/${file.file_path}`;
                      const response = await fetch(fileUrl);
                      const fileBuffer = Buffer.from(await response.arrayBuffer());
                      
                      // Обрабатываем файл
                      fileContent = await this.openRouterService.processFile(fileBuffer, fileInfo.mimeType);
                      
                      this.logger.log(`File processed successfully, content length: ${fileContent.length} characters`);
                      
                      // Удаляем информацию о файле после обработки
                      await this.redisService.del(latestFileKey);
                      
                      await ctx.reply(this.t(ctx, 'file_analyzing'));
                    }
                  } catch (fileError) {
                    this.logger.error(`Error processing file for user ${userId}:`, fileError);
                    await ctx.reply(this.t(ctx, 'error_processing_file_retry'));
                  }
                }
              }

              this.logger.log(`Sending request to OpenRouter for user ${userId}, model: ${model}, history length: ${history.length}, has file: ${!!fileContent}`);
              
              const answer = await this.openRouterService.ask(history, model, fileContent);
              
              this.logger.log(`Received response from OpenRouter for user ${userId}, response length: ${answer.length}`);
          
              await this.redisService.saveMessage(userId, 'assistant', answer);
          
              const modelDisplayName = this.getModelDisplayName(ctx, model);
              const modelInfo = `🤖 **${this.t(ctx, 'model')}:** ${modelDisplayName}\n\n`;
              
              await ctx.reply(modelInfo + answer, { parse_mode: 'Markdown' });
            } catch (error) {
              this.logger.error(`Error processing message from user ${String(ctx.from?.id)}:`, error);
              await ctx.reply(this.t(ctx, 'error_processing_message'));
            }
          });

        this.bot.on('message:document', async (ctx) => {
            try {
                await this.initializeSession(ctx);
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
                
                await this.redisService.set(`file:${userId}:${doc.file_id}`, JSON.stringify(fileInfo), 60 * 60); // 1 час
                
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
                await this.initializeSession(err.ctx);
                await err.ctx.reply(this.t(err.ctx, 'unexpected_error'));
            } catch {}
        });

        
        await this.bot.init();
        this.bot.start();
    }

    private async setMyCommands() {
        if (!this.bot) {
            throw new Error('Bot is not initialized');
        }
        
        this.logger.log('Setting up bot commands with localized descriptions...');

        // Определяем список команд с их ключами локализации
        const commands = [
            { command: 'start', key: 'bot_command_start' },
            { command: 'help', key: 'bot_command_help' },
            { command: 'model', key: 'bot_command_model' },
            { command: 'profile', key: 'bot_command_profile' },
            { command: 'language', key: 'bot_command_language' },
            { command: 'clear', key: 'bot_command_clear' },
            { command: 'billing', key: 'bot_command_billing' }
        ];

        // Устанавливаем команды для английского языка по умолчанию
        await this.bot.api.setMyCommands(
            commands.map(cmd => ({ 
                command: cmd.command, 
                description: this.i18n.t(cmd.key, 'en') 
            }))
        );
        this.logger.log('✅ Default commands (en) registered');

        // Устанавливаем команды для всех поддерживаемых языков
        const supportedLocales = this.i18n.getSupportedLocales();
        
        for (const locale of supportedLocales) {
            await this.bot.api.setMyCommands(
                commands.map(cmd => ({ 
                    command: cmd.command, 
                    description: this.i18n.t(cmd.key, locale) 
                })),
                { language_code: locale as any }
            );
        }
        
        this.logger.log(`✅ Commands registered for ${supportedLocales.length} locales`);
    }

    private getModelDisplayName(ctx: BotContext, model: string): string {
        const modelNames: { [key: string]: string } = {
            'deepseek/deepseek-chat-v3.1': this.t(ctx, 'model_deepseek'),
            'openai/gpt-5': this.t(ctx, 'model_gpt5'),
            'anthropic/claude-sonnet-4': this.t(ctx, 'model_claude_sonnet'),
            'x-ai/grok-4': this.t(ctx, 'model_grok'),
            'openai/gpt-5-mini': this.t(ctx, 'model_gpt5_mini')
        };
        
        return modelNames[model] || model;
    }
    

    /**
     * Получить перевод с учетом языка из сессии пользователя
     */
    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }
}
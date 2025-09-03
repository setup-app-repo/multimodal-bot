import { Injectable, Logger } from '@nestjs/common';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { BotContext } from '../interfaces';
import { getModelDisplayName, escapeMarkdown, sendLongMessage } from '../utils';
import { TelegramFileService } from './telegram-file.service';
import { AccessControlService } from './access-control.service';
import { DEFAULT_MODEL } from '../constants';

@Injectable()
export class MessageHandlerService {
    private readonly logger = new Logger(MessageHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly openRouterService: OpenRouterService,
        private readonly telegramFileService: TelegramFileService,
        private readonly accessControlService: AccessControlService,
    ) {}

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    async handleText(ctx: Filter<BotContext, 'message:text'>) {
        try {
            const text = ctx.message.text;
            if (text.startsWith('/')) return;

            const helpButtonText = this.t(ctx, 'help_button');
            const profileButtonText = this.t(ctx, 'profile_button');
            const modelSelectionButtonText = this.t(ctx, 'model_selection_button');
            if ([helpButtonText, profileButtonText, modelSelectionButtonText].includes(text)) return;

            const userId = String(ctx.from?.id);
            const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

            this.logger.log(`Processing text message from user ${userId}, model: ${model}`);

            // Модель по умолчанию всегда установлена через DEFAULT_MODEL

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
                this.logger.error(`Error processing file for user ${userId}:`, fileError as any);
                await ctx.reply(this.t(ctx, 'error_processing_file_retry'));
            }

            this.logger.log(`Sending request to OpenRouter for user ${userId}, model: ${model}, history length: ${history.length}, has file: ${!!fileContent}`);

            const isFilePresent = !!fileContent && fileContent.length > 0;
            const priceMultiplier = isFilePresent ? 2 : 1; // Удваиваем стоимость, если есть файл
            
            // Проверка доступа и лимитов через AccessControlService
            const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, priceMultiplier);
            if (!accessResult.canProceed) {
                return;
            }

            const price = accessResult.price;
            this.logger.log(`Will deduct ${price} SP for user ${userId} for model ${model}. isFilePresent: ${isFilePresent}`);

            // Отправляем индикатор обработки перед запросом к модели
            const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
            let answer: string;
            try {
                answer = await this.openRouterService.ask(history, model, fileContent);
            } catch (err: any) {
                const status = (err && err.status) || (err && err.response && err.response.status);
                const code = err?.code;
                const name = err?.name;
                const messageText = String(err?.message || err || '');
                const lower = messageText.toLowerCase();
                this.logger.error(`Error calling model for user ${userId}: code=${code} status=${status} name=${name} message=${messageText}`);

                if (
                    (typeof status === 'number' && (status === 429 || status >= 500)) ||
                    (name && String(name).toLowerCase().includes('timeout')) ||
                    lower.includes('timeout') || lower.includes('timed out') || lower.includes('request timed out')
                ) {
                    try { await ctx.reply(this.t(ctx, 'error_timeout')); } catch {}
                } else {
                    try { await ctx.reply(this.t(ctx, 'unexpected_error')); } catch {}
                }
                return;
            } finally {
                // Удаляем индикатор независимо от результата
                try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch {}
            }

            // Списание SP через AccessControlService
            const description = isFilePresent ? `Query to ${model} (file)` : `Query to ${model}`;
            await this.accessControlService.deductSPIfNeeded(userId, model, price, description);

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
            this.logger.error(`Error processing message from user ${String(ctx.from?.id)}:`, error as any);
            try { await ctx.reply(this.t(ctx, 'error_processing_message')); } catch {}
        }
    }

    async handleError(err: any) {
        this.logger.error('Unhandled bot error:', err);
        try {
            await err.ctx.reply(this.t(err.ctx, 'unexpected_error'));
        } catch {}
    }
}



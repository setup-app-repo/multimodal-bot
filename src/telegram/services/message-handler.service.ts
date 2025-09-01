import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { BotContext } from '../interfaces';
import { Filter } from 'grammy';
import { getModelDisplayName } from '../utils/model-display';
import { escapeMarkdown, sendLongMessage } from '../utils/message';
import { TelegramFileService } from './telegram-file.service';
import { getPriceSP, MODEL_TO_TIER, ModelTier, DAILY_BASE_FREE_LIMIT, DEFAULT_MODEL } from '../constants';

@Injectable()
export class MessageHandlerService {
    private readonly logger = new Logger(MessageHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly openRouterService: OpenRouterService,
        private readonly setupAppService: SetupAppService,
        private readonly subscriptionService: SubscriptionService,
        private readonly telegramFileService: TelegramFileService,
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

            const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
            const basePrice = getPriceSP(model, hasActiveSubscription);
            const isFilePresent = !!fileContent && fileContent.length > 0;
            const price = isFilePresent ? basePrice * 2 : basePrice; // Удваиваем стоимость, если есть файл
            this.logger.log(`Will deduct ${price} SP for user ${userId} for model ${model}. hasActiveSubscription: ${hasActiveSubscription}, isFilePresent: ${isFilePresent}`);

            const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
            const isBaseNoSub = !hasActiveSubscription && tier === ModelTier.BASE;

            const hasEnoughSP = await this.setupAppService.have(Number(userId), price);
            if (!hasEnoughSP && !isBaseNoSub) {
                await ctx.reply(this.t(ctx, 'insufficient_funds'));
                return;
            }

            if (isBaseNoSub) {
                try {
                    const usedToday = await this.redisService.incrementDailyBaseCount(userId);
                    if (usedToday > DAILY_BASE_FREE_LIMIT) {
                        await ctx.reply(this.t(ctx, 'daily_limit_reached'));
                        return;
                    }
                } catch (limitError) {
                    this.logger.error(`Daily limit check failed for user ${userId}:`, limitError as any);
                }
            }

            // Отправляем индикатор обработки перед запросом к модели
            const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
            let answer: string;
            try {
                answer = await this.openRouterService.ask(history, model, fileContent);
            } finally {
                // Удаляем индикатор независимо от результата
                try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch {}
            }

            if (tier !== ModelTier.BASE) {
                const description = isFilePresent ? `Query to ${model} (file)` : `Query to ${model}`;
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



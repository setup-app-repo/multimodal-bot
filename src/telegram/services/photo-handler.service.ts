import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { Filter } from 'grammy';
import { TelegramFileService } from './telegram-file.service';
import { MAX_FILE_SIZE_BYTES, MODELS_SUPPORTING_FILES, DEFAULT_MODEL, getPriceSP, MODEL_TO_TIER, ModelTier, DAILY_BASE_FREE_LIMIT } from '../constants';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { getModelDisplayName } from '../utils/model-display';
import { escapeMarkdown, sendLongMessage } from '../utils/message';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PhotoHandlerService {
    private readonly logger = new Logger(PhotoHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly telegramFileService: TelegramFileService,
        private readonly openRouterService: OpenRouterService,
        private readonly subscriptionService: SubscriptionService,
        private readonly setupAppService: SetupAppService,
        private readonly configService: ConfigService,
    ) {}

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    async handlePhoto(ctx: Filter<BotContext, 'message:photo'>) {
        try {
            const photos = ctx.message.photo;
            if (!photos || photos.length === 0) return;

            // Берем самое большое фото (последний элемент массива)
            const largest = photos[photos.length - 1];

            const userId = String(ctx.from?.id);
            const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

            this.logger.log(`Photo received from user ${userId}: file_id=${largest.file_id}, size=${largest.file_size || 0}`);

            const size = largest.file_size ?? 0;
            if (size > MAX_FILE_SIZE_BYTES) {
                this.logger.warn(`User ${userId} tried to upload photo with size ${size} bytes (exceeds limit)`);
                await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
                return;
            }

            if (!MODELS_SUPPORTING_FILES.has(model)) {
                this.logger.warn(`User ${userId} tried to upload photo with unsupported model: ${model}`);
                await ctx.reply(this.t(ctx, 'warning_model_no_file_support'));
                return;
            }

            // Скачиваем файл и отправляем в модель напрямую
            const file = await ctx.api.getFile(largest.file_id);
            if (!file?.file_path) return;

            const token = this.configService.get<string>('BOT_TOKEN');
            const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
            const resp = await fetch(fileUrl);
            const buffer = Buffer.from(await resp.arrayBuffer());
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64}`;

            const caption = ctx.message.caption?.trim();

            const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
            const price = getPriceSP(model, hasActiveSubscription);
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
                } catch {}
            }

            await ctx.api.sendChatAction(ctx.chat.id, 'typing');
            const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));

            const history = await this.redisService.getHistory(userId);

            const answer = await this.openRouterService.askWithImages(
                history,
                model,
                [{ mimeType: 'image/jpeg', dataUrl }],
                caption || undefined,
            );

            try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch {}

            if (tier !== ModelTier.BASE) {
                const description = `Query to ${model} (image)`;
                await this.setupAppService.deduct(Number(userId), price, description);
            }

            await this.redisService.saveMessage(userId, 'user', caption || '[изображение]');
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
            this.logger.error(`Error processing photo from user ${String(ctx.from?.id)}:`, error as any);
            try { await ctx.reply(this.t(ctx, 'error_processing_file')); } catch {}
        }
    }
}



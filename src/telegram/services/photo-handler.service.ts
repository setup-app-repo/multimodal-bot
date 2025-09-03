import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { AccessControlService } from './access-control.service';
import { MAX_FILE_SIZE_BYTES, MODELS_SUPPORTING_PHOTOS, DEFAULT_MODEL } from '../constants';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { getModelDisplayName, escapeMarkdown, sendLongMessage } from '../utils';

@Injectable()
export class PhotoHandlerService {
    private readonly logger = new Logger(PhotoHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly openRouterService: OpenRouterService,
        private readonly configService: ConfigService,
        private readonly accessControlService: AccessControlService,
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

            // Проверка поддержки медиа бесплатной моделью
            if (!this.accessControlService.isMediaSupportedByModel(model)) {
                await this.accessControlService.sendFreeModelNoMediaMessage(ctx);
                return;
            }

            this.logger.log(`Photo received from user ${userId}: file_id=${largest.file_id}, size=${largest.file_size || 0}`);

            const size = largest.file_size ?? 0;
            if (size > MAX_FILE_SIZE_BYTES) {
                this.logger.warn(`User ${userId} tried to upload photo with size ${size} bytes (exceeds limit)`);
                await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
                return;
            }

            if (!MODELS_SUPPORTING_PHOTOS.has(model)) {
                this.logger.warn(`User ${userId} tried to upload photo with unsupported model: ${model}`);
                await ctx.reply(this.t(ctx, 'warning_model_no_photo_support'));
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

            // Проверка доступа и лимитов через AccessControlService (удваиваем стоимость для фото)
            const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
            if (!accessResult.canProceed) {
                return;
            }

            const price = accessResult.price;

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

            // Списание SP через AccessControlService
            await this.accessControlService.deductSPIfNeeded(userId, model, price, `Query to ${model} (image)`);

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



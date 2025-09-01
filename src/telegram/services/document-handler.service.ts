import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { Filter } from 'grammy';
import { TelegramFileService } from './telegram-file.service';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, MODELS_SUPPORTING_FILES, DEFAULT_MODEL } from '../constants';

@Injectable()
export class DocumentHandlerService {
    private readonly logger = new Logger(DocumentHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly telegramFileService: TelegramFileService,
    ) {}

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    async handleDocument(ctx: Filter<BotContext, 'message:document'>) {
        try {
            const doc = ctx.message.document;
            if (!doc) return;

            const userId = String(ctx.from?.id);
            const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

            this.logger.log(`Document received from user ${userId}: ${doc.file_name} (${doc.mime_type}, ${doc.file_size} bytes)`);

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

            // Модель по умолчанию всегда установлена через DEFAULT_MODEL

            if (!MODELS_SUPPORTING_FILES.has(model)) {
                this.logger.warn(`User ${userId} tried to upload file with unsupported model: ${model}`);
                await ctx.reply(this.t(ctx, 'warning_model_no_file_support'));
                return;
            }

            await this.telegramFileService.saveFileMeta(
                userId,
                {
                    fileId: doc.file_id,
                    fileName: doc.file_name,
                    mimeType: mime,
                    fileSize: size,
                    timestamp: Date.now()
                },
                60 * 60
            );

            this.logger.log(`File ${doc.file_name} saved for user ${userId}, fileId: ${doc.file_id}`);

            await ctx.reply(
                `${this.t(ctx, 'file_accepted')}\n\n` +
                `${this.t(ctx, 'file_name', { name: doc.file_name })}\n` +
                `${this.t(ctx, 'file_size', { size: (size / 1024 / 1024).toFixed(2) })}\n` +
                `${this.t(ctx, 'file_type', { type: mime })}`
            );
        } catch (error) {
            this.logger.error(`Error processing document from user ${String(ctx.from?.id)}:`, error as any);
            try { await ctx.reply(this.t(ctx, 'error_processing_file')); } catch {}
        }
    }
}



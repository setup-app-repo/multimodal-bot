import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { DEFAULT_MODEL, MODELS_SUPPORTING_AUDIO, PROCESSING_STICKER_FILE_ID } from '../constants';
import { BotContext } from '../interfaces';
import { getModelDisplayName, sendLongMessage, stripCodeFences, escapeHtml, getFileWithRetry, sendChatActionWithRetry, sendStickerWithRetry, deleteMessageWithRetry } from '../utils';

import { AccessControlService } from './access-control.service';
import { AudioConversionService } from './audio-conversion.service';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class AudioHandlerService {
    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly openRouterService: OpenRouterService,
        private readonly configService: ConfigService,
        private readonly audioConversionService: AudioConversionService,
        private readonly accessControlService: AccessControlService,
        private readonly logger: WinstonLoggerService,
    ) { }

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    async handleAudio(ctx: Filter<BotContext, 'message:audio'>) {
        try {
            const audio = ctx.message.audio;
            if (!audio) return;

            const userId = String(ctx.from?.id);
            const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

            const mediaAllowed = await this.accessControlService.isMediaAllowed(userId, model);
            if (!mediaAllowed) {
                await this.accessControlService.sendFreeModelNoMediaMessage(ctx);
                return;
            }

            if (!MODELS_SUPPORTING_AUDIO.has(model)) {
                await ctx.reply(this.t(ctx, 'warning_model_no_voice_support'));
                return;
            }

            this.logger.log(
                `Audio from user ${userId}: file_id=${audio.file_id}, file_name=${audio.file_name}, mime=${audio.mime_type}, size=${audio.file_size || 0}`,
                AudioHandlerService.name,
            );

            const file = await getFileWithRetry(ctx.api as any, audio.file_id, this.logger);
            if (!file?.file_path) return;

            const token = this.configService.get<string>('BOT_TOKEN');
            const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
            const resp = await fetch(fileUrl);
            const inputBuffer = Buffer.from(await resp.arrayBuffer());

            // Если OGG — конвертим в MP3; если MP3 — отправляем как есть
            let convertedBuffer: Buffer;
            let format: 'mp3' | 'wav' = 'mp3';
            const lower = (audio.mime_type || '').toLowerCase();
            const pathLower = (file.file_path || '').toLowerCase();
            if (lower.includes('ogg') || pathLower.endsWith('.ogg') || pathLower.endsWith('.oga')) {
                this.logger.log(`Converting OGG audio to mp3 for user ${userId}`, AudioHandlerService.name);
                convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
                format = 'mp3';
            } else if (lower.includes('mp3') || pathLower.endsWith('.mp3')) {
                convertedBuffer = inputBuffer;
                format = 'mp3';
            } else if (pathLower.endsWith('.wav') || lower.includes('wav')) {
                convertedBuffer = inputBuffer;
                format = 'wav';
            } else {
                // Бэкап: пробуем как ogg->mp3
                this.logger.log(`Unknown audio type (${audio.mime_type} / ${file.file_path}), attempting ogg->mp3`, AudioHandlerService.name);
                convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
                format = 'mp3';
            }

            const base64Audio = convertedBuffer.toString('base64');

            const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
            if (!accessResult.canProceed) {
                return;
            }
            const price = accessResult.price;

            await sendChatActionWithRetry(ctx.api as any, ctx.chat.id, 'typing');
            const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
            let stickerMessageId: number | null = null;
            try {
                const stickerMessage = await sendStickerWithRetry(ctx.api as any, ctx.chat.id, PROCESSING_STICKER_FILE_ID);
                stickerMessageId = (stickerMessage as any)?.message_id ?? null;
            } catch { }

            const history = await this.redisService.getHistory(userId);
            const contextImageDataUrl = await this.redisService.getLastImageDataUrl(userId).catch(() => null);
            const answer = await this.openRouterService.askWithAudio(
                history,
                model,
                base64Audio,
                format,
                undefined,
                contextImageDataUrl || undefined,
            );

            try {
                await deleteMessageWithRetry(ctx.api as any, ctx.chat.id, processingMessage.message_id);
                if (typeof stickerMessageId === 'number') {
                    try { await deleteMessageWithRetry(ctx.api as any, ctx.chat.id, stickerMessageId); } catch { }
                }
            } catch { }

            await this.accessControlService.deductSPIfNeeded(
                userId,
                model,
                price,
                `Query to ${model} (audio)`,
            );

            await this.redisService.saveMessage(userId, 'user', `[аудио: ${audio.file_name || 'file'}]`);
            await this.redisService.saveMessage(userId, 'assistant', answer);

            const modelDisplayName = getModelDisplayName(model);
            const modelLabel = this.t(ctx, 'model');
            const modelInfo = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}\n\n`;
            const cleaned = stripCodeFences(answer);
            const safeAnswer = escapeHtml(cleaned);
            await sendLongMessage(
                ctx,
                (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
                modelInfo + safeAnswer,
                { parse_mode: 'HTML' },
            );
        } catch (error) {
            this.logger.error(`Error processing audio from user ${String(ctx.from?.id)}:`, error as any, AudioHandlerService.name);
            try {
                await ctx.reply(this.t(ctx, 'error_processing_file'));
            } catch { }
        }
    }
}



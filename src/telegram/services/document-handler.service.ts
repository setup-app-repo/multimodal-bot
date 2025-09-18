import { Injectable } from '@nestjs/common';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from 'src/openrouter/openrouter.service';

import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  MODELS_SUPPORTING_FILES,
  DEFAULT_MODEL,
  DOC_EXTENSIONS,
  MODELS_SUPPORTING_AUDIO,
  PROCESSING_STICKER_FILE_ID,
} from '../constants';
import { BotContext } from '../interfaces';
import { getFileWithRetry, getModelDisplayName, sendChatActionWithRetry, sendLongMessage, sendStickerWithRetry, deleteMessageWithRetry, stripCodeFences, escapeHtml } from '../utils';

import { AccessControlService } from './access-control.service';
import { TelegramFileService } from './telegram-file.service';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';
import { AudioConversionService } from './audio-conversion.service';

@Injectable()
export class DocumentHandlerService {
  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly openRouterService: OpenRouterService,
    private readonly telegramFileService: TelegramFileService,
    private readonly audioConversionService: AudioConversionService,
    private readonly accessControlService: AccessControlService,
    private readonly logger: WinstonLoggerService,
  ) { }

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

      // Проверка допуска медиа (бесплатная модель без Премиума запрещена)
      const mediaAllowed = await this.accessControlService.isMediaAllowed(userId, model);
      if (!mediaAllowed) {
        await this.accessControlService.sendFreeModelNoMediaMessage(ctx);
        return;
      }

      this.logger.log(
        `Document received from user ${userId}: ${doc.file_name} (${doc.mime_type}, ${doc.file_size} bytes)`,
        DocumentHandlerService.name,
      );

      // Ветка: если это аудио-файл (mp3/ogg/wav), обрабатываем как голосовое прямо сейчас
      const mimeLower = (doc.mime_type || '').toLowerCase();
      const nameLower = (doc.file_name || '').toLowerCase();
      const isAudio =
        mimeLower.startsWith('audio/') ||
        nameLower.endsWith('.mp3') ||
        nameLower.endsWith('.ogg') ||
        nameLower.endsWith('.oga') ||
        nameLower.endsWith('.wav');

      if (isAudio) {
        if (!MODELS_SUPPORTING_AUDIO.has(model)) {
          await ctx.reply(this.t(ctx, 'warning_model_no_voice_support'));
          return;
        }

        const size = doc.file_size ?? 0;
        if (size > MAX_FILE_SIZE_BYTES) {
          this.logger.warn(
            `User ${userId} tried to upload audio ${doc.file_name} with size ${size} bytes (exceeds limit)`,
            DocumentHandlerService.name,
          );
          await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
          return;
        }

        const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
        if (!accessResult.canProceed) {
          return;
        }
        const price = accessResult.price;

        const file = await getFileWithRetry(ctx.api as any, doc.file_id, this.logger);
        if (!file?.file_path) return;

        const token = this.configService.get<string>('BOT_TOKEN');
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const resp = await fetch(fileUrl);
        const inputBuffer = Buffer.from(await resp.arrayBuffer());

        let convertedBuffer: Buffer;
        let format: 'mp3' | 'wav' = 'mp3';
        const pathLower = (file.file_path || '').toLowerCase();
        if (mimeLower.includes('ogg') || pathLower.endsWith('.ogg') || pathLower.endsWith('.oga')) {
          this.logger.log(`Converting OGG audio to mp3 for user ${userId}`, DocumentHandlerService.name);
          convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
          format = 'mp3';
        } else if (mimeLower.includes('mp3') || pathLower.endsWith('.mp3')) {
          convertedBuffer = inputBuffer;
          format = 'mp3';
        } else if (pathLower.endsWith('.wav') || mimeLower.includes('wav')) {
          convertedBuffer = inputBuffer;
          format = 'wav';
        } else {
          this.logger.log(`Unknown audio type (${doc.mime_type} / ${file.file_path}), attempting ogg->mp3`, DocumentHandlerService.name);
          convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
          format = 'mp3';
        }

        const base64Audio = convertedBuffer.toString('base64');

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

        await this.redisService.saveMessage(userId, 'user', `[аудио-документ: ${doc.file_name || 'file'}]`);
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
        return;
      }

      const size = doc.file_size ?? 0;
      if (size > MAX_FILE_SIZE_BYTES) {
        this.logger.warn(
          `User ${userId} tried to upload file ${doc.file_name} with size ${size} bytes (exceeds limit)`,
          DocumentHandlerService.name,
        );
        await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
        return;
      }

      const mime = doc.mime_type || '';
      if (!ALLOWED_MIME_TYPES.has(mime)) {
        this.logger.warn(`User ${userId} tried to upload unsupported file type: ${mime}`, DocumentHandlerService.name);
        await ctx.reply(this.t(ctx, 'warning_unsupported_file_type'));
        return;
      }

      // Дополнительная проверка по расширению имени файла
      const name = (doc.file_name || '').toLowerCase();
      const ext = name.split('.').pop() || '';
      const hasAllowedExt = DOC_EXTENSIONS.has(ext);
      if (!hasAllowedExt) {
        this.logger.warn(`User ${userId} tried to upload unsupported file extension: ${doc.file_name}`, DocumentHandlerService.name);
        await ctx.reply(this.t(ctx, 'warning_unsupported_file_type'));
        return;
      }

      if (!MODELS_SUPPORTING_FILES.has(model)) {
        this.logger.warn(`User ${userId} tried to upload file with unsupported model: ${model}`, DocumentHandlerService.name);
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
          timestamp: Date.now(),
        },
        60 * 60,
      );

      this.logger.log(`File ${doc.file_name} saved for user ${userId}, fileId: ${doc.file_id}`, DocumentHandlerService.name);

      const humanSize = size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(2)} KB`
          : `${(size / 1024 / 1024).toFixed(2)} MB`;

      await ctx.reply(
        `${this.t(ctx, 'file_accepted')}\n\n` +
        `${this.t(ctx, 'file_name', { name: doc.file_name })}\n` +
        `${this.t(ctx, 'file_size', { size: humanSize })}\n` +
        `${this.t(ctx, 'file_type', { type: mime })}`,
      );
    } catch (error) {
      this.logger.error(`Error processing document from user ${String(ctx.from?.id)}:`, error as any, DocumentHandlerService.name);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_file'));
      } catch { }
    }
  }
}

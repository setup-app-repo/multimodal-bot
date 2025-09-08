import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { DEFAULT_MODEL, MODELS_SUPPORTING_AUDIO, PROCESSING_STICKER_FILE_ID } from '../constants';
import { BotContext } from '../interfaces';
import { getModelDisplayName, sendLongMessage, stripCodeFences, escapeHtml } from '../utils';

import { AccessControlService } from './access-control.service';
import { AudioConversionService } from './audio-conversion.service';

@Injectable()
export class VoiceHandlerService {
  private readonly logger = new Logger(VoiceHandlerService.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly configService: ConfigService,
    private readonly audioConversionService: AudioConversionService,
    private readonly accessControlService: AccessControlService,
  ) { }

  private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    return this.i18n.t(key, userLang, args);
  }

  async handleVoice(ctx: Filter<BotContext, 'message:voice'>) {
    try {
      const voice = ctx.message.voice;
      if (!voice) return;

      const userId = String(ctx.from?.id);
      const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

      // Проверка допуска медиа (бесплатная модель без Премиума запрещена)
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
        `Voice message from user ${userId}: file_id=${voice.file_id}, duration=${voice.duration}s, size=${voice.file_size || 0}`,
      );

      const file = await ctx.api.getFile(voice.file_id);
      if (!file?.file_path) return;

      const token = this.configService.get<string>('BOT_TOKEN');
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const resp = await fetch(fileUrl);
      const inputBuffer = Buffer.from(await resp.arrayBuffer());

      // Конвертация .ogg/.oga (Opus) -> .mp3
      let convertedBuffer: Buffer;
      let format: 'mp3' | 'wav' = 'mp3';
      if (file.file_path.endsWith('.ogg') || file.file_path.endsWith('.oga')) {
        this.logger.log(`Converting OGG/OGA (Opus) to mp3 for user ${userId}`);
        convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
        format = 'mp3';
      } else if (file.file_path.endsWith('.wav')) {
        convertedBuffer = inputBuffer;
        format = 'wav';
      } else if (file.file_path.endsWith('.mp3')) {
        convertedBuffer = inputBuffer;
        format = 'mp3';
      } else {
        // На всякий случай: пробуем как ogg->mp3
        this.logger.log(
          `Unknown extension for voice ${file.file_path}, attempting ogg->mp3 conversion`,
        );
        convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
        format = 'mp3';
      }

      const base64Audio = convertedBuffer.toString('base64');

      // Проверка доступа и лимитов через AccessControlService (удваиваем стоимость для голосовых сообщений)
      const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
      if (!accessResult.canProceed) {
        return;
      }

      const price = accessResult.price;

      await ctx.api.sendChatAction(ctx.chat.id, 'typing');
      const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
      let stickerMessageId: number | null = null;
      try {
        const stickerMessage = await ctx.api.sendSticker(
          ctx.chat.id,
          PROCESSING_STICKER_FILE_ID,
        );
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
        await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id);
        if (typeof stickerMessageId === 'number') {
          try { await ctx.api.deleteMessage(ctx.chat.id, stickerMessageId); } catch { }
        }
      } catch { }

      // Списание SP через AccessControlService
      await this.accessControlService.deductSPIfNeeded(
        userId,
        model,
        price,
        `Query to ${model} (audio)`,
      );

      await this.redisService.saveMessage(userId, 'user', '[голосовое сообщение]');
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
      this.logger.error(`Error processing voice from user ${String(ctx.from?.id)}:`, error);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_file'));
      } catch { }
    }
  }
}

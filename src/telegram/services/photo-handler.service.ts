import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter, InputFile } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { MAX_FILE_SIZE_BYTES, MODELS_SUPPORTING_PHOTOS, DEFAULT_MODEL, PROCESSING_STICKER_FILE_ID, IMAGE_EXTENSIONS, IMAGE_EXTENSION_TO_MIME } from '../constants';
import { BotContext } from '../interfaces';
import { getModelDisplayName, sendLongMessage, stripCodeFences, escapeHtml, buildImageFooterByLang } from '../utils';

import { AccessControlService } from './access-control.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';

@Injectable()
export class PhotoHandlerService {
  private readonly logger = new Logger(PhotoHandlerService.name);
  private readonly albumCollector = new Map<string, {
    images: { mimeType: string; dataUrl: string }[],
    caption?: string,
    timer: NodeJS.Timeout,
    processed: boolean
  }>();

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly configService: ConfigService,
    private readonly accessControlService: AccessControlService,
    private readonly setupAppService: SetupAppService,
  ) { }

  private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    return this.i18n.t(key, userLang, args);
  }

  private buildImageFooter(ctx: BotContext, link?: string): string {
    const lang = (ctx as any)?.session?.lang || this.i18n.getDefaultLocale();
    return buildImageFooterByLang(lang, link);
  }

  private async processAlbum(ctx: BotContext, userId: string, model: string, albumKey: string) {
    const album = this.albumCollector.get(albumKey);
    if (!album || album.processed) return;

    // Помечаем как обработанный
    album.processed = true;
    clearTimeout(album.timer);

    this.logger.log(`Processing album ${albumKey} with ${album.images.length} images`);

    try {
      // Проверка доступа и списание
      const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
      if (!accessResult.canProceed) return;
      const price = accessResult.price;
      await this.accessControlService.deductSPIfNeeded(userId, model, price, `Query to ${model} (image-album)`);

      // Отправляем индикатор обработки перед запросом к модели
      const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
      let stickerMessageId: number | null = null;
      try {
        const stickerMessage = await ctx.api.sendSticker(
          ctx.chat!.id,
          PROCESSING_STICKER_FILE_ID,
        );
        stickerMessageId = (stickerMessage as any)?.message_id ?? null;
      } catch { }

      await ctx.api.sendChatAction(ctx.chat!.id, 'typing');
      const history = await this.redisService.getHistory(userId);

      if (model === 'google/gemini-2.5-flash-image-preview') {
        // Для Gemini Image: генерация изображения на основе нескольких входных
        const { images: outImages, text } = await this.openRouterService.generateImageFromMultipleInputs(
          model,
          album.caption || 'Apply subtle, high-quality enhancement combining inputs.',
          album.images.map((i) => i.dataUrl),
        );

        if (outImages && outImages.length > 0) {
          const first = outImages[0];
          const ext = first.mimeType === 'image/png' ? 'png' : first.mimeType === 'image/webp' ? 'webp' : 'jpg';
          const inputFile = new InputFile(first.buffer, `result.${ext}`);
          const modelDisplayName = getModelDisplayName(model);
          const modelLabel = this.t(ctx, 'model');
          const parts: string[] = [`🤖 <b>${modelLabel}:</b> ${modelDisplayName}`];
          const info = await this.setupAppService.getIntegrationInfo();
          const botUsername = (info as any)?.botUsername || '';
          const tgId = String((ctx as any)?.from?.id ?? userId);
          const link = botUsername ? `https://t.me/${botUsername}?start=${encodeURIComponent(tgId)}` : undefined;
          const footer = this.buildImageFooter(ctx, link)
          parts.push(footer);
          const finalCaption = parts.join('\n\n').slice(0, 1024);

          // Удаляем индикаторы обработки
          try { await ctx.api.deleteMessage(ctx.chat!.id, processingMessage.message_id); } catch { }
          if (stickerMessageId) {
            try { await ctx.api.deleteMessage(ctx.chat!.id, stickerMessageId); } catch { }
          }

          const replyTo = (ctx as any)?.message?.message_id ?? (ctx as any)?.msg?.message_id;
          await ctx.api.sendPhoto(ctx.chat!.id, inputFile, { caption: finalCaption, parse_mode: 'HTML', reply_to_message_id: replyTo });

          // Сохраняем последнее сгенерированное изображение для контекста
          const imageDataUrl = `data:${first.mimeType};base64,${first.buffer.toString('base64')}`;
          await this.redisService.setLastImageDataUrl(userId, imageDataUrl);

          await this.redisService.saveMessage(userId, 'user', album.caption || '[изображение]');
          await this.redisService.saveMessage(userId, 'assistant', text || '[image]');
        } else if (text && text.trim()) {
          // Fallback: текстовый ответ
          // Удаляем индикаторы обработки
          try { await ctx.api.deleteMessage(ctx.chat!.id, processingMessage.message_id); } catch { }
          if (stickerMessageId) {
            try { await ctx.api.deleteMessage(ctx.chat!.id, stickerMessageId); } catch { }
          }

          const modelDisplayName = getModelDisplayName(model);
          const modelLabel = this.t(ctx, 'model');
          const modelInfo = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}\n\n`;
          const cleaned = stripCodeFences(text);
          const safeAnswer = escapeHtml(cleaned);
          await sendLongMessage(
            ctx,
            (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
            modelInfo + safeAnswer,
            { parse_mode: 'HTML' },
          );
          await this.redisService.saveMessage(userId, 'user', album.caption || '[изображение]');
          await this.redisService.saveMessage(userId, 'assistant', text);
        }
      } else {
        // Прочие мультимодели: текстовый ответ, видящий все изображения
        const answer = await this.openRouterService.askWithImages(
          history,
          model,
          album.images,
          album.caption || undefined,
        );

        await this.redisService.saveMessage(userId, 'user', album.caption || '[изображение]');
        await this.redisService.saveMessage(userId, 'assistant', answer);

        // Сохраняем последнюю фотографию из альбома для контекста
        if (album.images.length > 0) {
          const lastImage = album.images[album.images.length - 1];
          await this.redisService.setLastImageDataUrl(userId, lastImage.dataUrl);
        }

        // Удаляем индикаторы обработки
        try { await ctx.api.deleteMessage(ctx.chat!.id, processingMessage.message_id); } catch { }
        if (stickerMessageId) {
          try { await ctx.api.deleteMessage(ctx.chat!.id, stickerMessageId); } catch { }
        }

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
      }
    } catch (error) {
      this.logger.error(`Error processing album ${albumKey}:`, error);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_file'));
      } catch { }
    } finally {
      // Очищаем коллектор
      this.albumCollector.delete(albumKey);
    }
  }

  async handlePhoto(ctx: Filter<BotContext, 'message:photo'>) {
    try {
      const photos = ctx.message.photo;
      if (!photos || photos.length === 0) return;

      // Берем самое большое фото (последний элемент массива)
      const largest = photos[photos.length - 1];

      const userId = String(ctx.from?.id);
      const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

      // Проверка допуска медиа (бесплатная модель без Премиума запрещена)
      const mediaAllowed = await this.accessControlService.isMediaAllowed(userId, model);
      if (!mediaAllowed) {
        await this.accessControlService.sendFreeModelNoMediaMessage(ctx);
        return;
      }

      this.logger.log(
        `Photo received from user ${userId}: file_id=${largest.file_id}, size=${largest.file_size || 0}`,
      );

      const size = largest.file_size ?? 0;
      if (size > MAX_FILE_SIZE_BYTES) {
        this.logger.warn(
          `User ${userId} tried to upload photo with size ${size} bytes (exceeds limit)`,
        );
        await ctx.reply(this.t(ctx, 'warning_file_size_limit'));
        return;
      }

      if (!MODELS_SUPPORTING_PHOTOS.has(model)) {
        this.logger.warn(`User ${userId} tried to upload photo with unsupported model: ${model}`);
        await ctx.reply(this.t(ctx, 'warning_model_no_photo_support'));
        return;
      }

      // Проверим альбом (media_group_id) и соберём все фото в памяти
      const mediaGroupId = (ctx.message as any).media_group_id as string | undefined;
      const caption = ctx.message.caption?.trim();
      if (mediaGroupId) {
        const albumKey = `${userId}:${mediaGroupId}`;

        // Скачиваем текущее фото
        const token = this.configService.get<string>('BOT_TOKEN');
        const file = await ctx.api.getFile(largest.file_id);
        if (!file?.file_path) return;
        const pathLower = file.file_path.toLowerCase();
        const ext = pathLower.split('.').pop() || '';
        if (!IMAGE_EXTENSIONS.has(ext)) {
          this.logger.warn(`User ${userId} sent unsupported photo type: ${file.file_path}`);
          await ctx.reply(this.t(ctx, 'warning_unsupported_photo_type'));
          return;
        }
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const resp = await fetch(fileUrl);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = IMAGE_EXTENSION_TO_MIME[ext] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Если альбом уже обработан — выходим
        const existing = this.albumCollector.get(albumKey);
        if (existing?.processed) return;

        // Добавляем фото в коллектор
        if (!existing) {
          // Первое фото — создаём коллектор и таймер
          const timer = setTimeout(async () => {
            await this.processAlbum(ctx, userId, model, albumKey);
          }, 1500);

          this.albumCollector.set(albumKey, {
            images: [{ mimeType, dataUrl }],
            caption,
            timer,
            processed: false
          });
          this.logger.log(`Started album collection for ${albumKey}`);
        } else {
          // Добавляем к существующему альбому
          existing.images.push({ mimeType, dataUrl });
          if (!existing.caption && caption) existing.caption = caption;
          this.logger.log(`Added photo to album ${albumKey}, total: ${existing.images.length}`);
        }
        return;
      }

      // Скачиваем файл и отправляем в модель напрямую
      const file = await ctx.api.getFile(largest.file_id);
      if (!file?.file_path) return;

      const token = this.configService.get<string>('BOT_TOKEN');
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const resp = await fetch(fileUrl);
      const buffer = Buffer.from(await resp.arrayBuffer());
      // Проверка формата по расширению пути (jpg/jpeg/png/webp)
      const pathLower = file.file_path.toLowerCase();
      const ext = pathLower.split('.').pop() || '';
      const allowed = IMAGE_EXTENSIONS.has(ext);
      if (!allowed) {
        this.logger.warn(`User ${userId} sent unsupported photo type: ${file.file_path}`);
        await ctx.reply(this.t(ctx, 'warning_unsupported_photo_type'));
        return;
      }
      const base64 = buffer.toString('base64');
      const mimeType = IMAGE_EXTENSION_TO_MIME[ext] || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Проверка доступа и лимитов через AccessControlService (удваиваем стоимость для фото)
      const accessResult = await this.accessControlService.checkAccess(ctx, userId, model, 2);
      if (!accessResult.canProceed) {
        return;
      }

      const price = accessResult.price;

      // Отправляем индикатор обработки перед запросом к модели
      const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));
      let stickerMessageId: number | null = null;
      try {
        const stickerMessage = await ctx.api.sendSticker(
          ctx.chat.id,
          PROCESSING_STICKER_FILE_ID,
        );
        stickerMessageId = (stickerMessage as any)?.message_id ?? null;
      } catch { }

      await ctx.api.sendChatAction(ctx.chat.id, 'typing');

      const history = await this.redisService.getHistory(userId);

      // Если выбрана модель Gemini Flash image-preview — пробуем редактирование изображения и отдаём саму картинку
      if (model === 'google/gemini-2.5-flash-image-preview') {
        const { images, text } = await this.openRouterService.generateOrEditImage(
          model,
          caption || 'Apply subtle, high-quality enhancement. Keep content and style coherent.',
          dataUrl,
        );

        await this.accessControlService.deductSPIfNeeded(
          userId,
          model,
          price,
          `Query to ${model} (image-edit)`,
        );

        await this.redisService.saveMessage(userId, 'user', caption || '[изображение]');
        await this.redisService.saveMessage(userId, 'assistant', text || '[image]');

        if (images && images.length > 0) {
          const first = images[0];
          const ext = first.mimeType === 'image/png' ? 'png' : first.mimeType === 'image/webp' ? 'webp' : 'jpg';
          const inputFile = new InputFile(first.buffer, `edit.${ext}`);
          const modelDisplayName = getModelDisplayName(model);
          const modelLabel = this.t(ctx, 'model');
          const parts: string[] = [`🤖 <b>${modelLabel}:</b> ${modelDisplayName}`];
          const info = await this.setupAppService.getIntegrationInfo();
          const botUsername = (info as any)?.botUsername || '';
          const tgId = String((ctx as any)?.from?.id ?? userId);
          const link = botUsername ? `https://t.me/${botUsername}?start=${encodeURIComponent(tgId)}` : undefined;
          const footer = this.buildImageFooter(ctx, link)
          parts.push(footer);
          const finalCaption = parts.join('\n\n').slice(0, 1024);

          // Удаляем индикаторы обработки
          try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch { }
          if (stickerMessageId) {
            try { await ctx.api.deleteMessage(ctx.chat.id, stickerMessageId); } catch { }
          }

          const replyTo = (ctx as any)?.message?.message_id ?? (ctx as any)?.msg?.message_id;
          await ctx.api.sendPhoto(ctx.chat.id, inputFile, { caption: finalCaption, parse_mode: 'HTML', reply_to_message_id: replyTo });

          // Сохраняем последнее сгенерированное изображение для контекста
          const imageDataUrl = `data:${first.mimeType};base64,${first.buffer.toString('base64')}`;
          await this.redisService.setLastImageDataUrl(userId, imageDataUrl);

          return;
        }

        // fallback на текст
        if (text) {
          // Удаляем индикаторы обработки
          try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch { }
          if (stickerMessageId) {
            try { await ctx.api.deleteMessage(ctx.chat.id, stickerMessageId); } catch { }
          }

          const modelDisplayName = getModelDisplayName(model);
          const modelLabel = this.t(ctx, 'model');
          const modelInfo = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}\n\n`;
          const cleaned = stripCodeFences(text);
          const safeAnswer = escapeHtml(cleaned);
          await sendLongMessage(
            ctx,
            (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
            modelInfo + safeAnswer,
            { parse_mode: 'HTML' },
          );
          return;
        }

        // Удаляем индикаторы обработки при ошибке
        try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch { }
        if (stickerMessageId) {
          try { await ctx.api.deleteMessage(ctx.chat.id, stickerMessageId); } catch { }
        }

        await ctx.reply(this.t(ctx, 'unexpected_error'));
        return;
      }

      const answer = await this.openRouterService.askWithImages(
        history,
        model,
        [{ mimeType: 'image/jpeg', dataUrl }],
        caption || undefined,
      );

      // Списание SP через AccessControlService
      await this.accessControlService.deductSPIfNeeded(
        userId,
        model,
        price,
        `Query to ${model} (image)`,
      );

      await this.redisService.saveMessage(userId, 'user', caption || '[изображение]');
      await this.redisService.saveMessage(userId, 'assistant', answer);

      // Сохраняем исходную фотографию для контекста
      await this.redisService.setLastImageDataUrl(userId, dataUrl);

      // Удаляем индикаторы обработки
      try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch { }
      if (stickerMessageId) {
        try { await ctx.api.deleteMessage(ctx.chat.id, stickerMessageId); } catch { }
      }

      const modelDisplayName = getModelDisplayName(model);
      const modelLabel = this.t(ctx, 'model');
      const modelInfo = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}\n\n`;
      const cleaned = stripCodeFences(answer);
      const safeAnswer = escapeHtml(cleaned);
      const finalMessage = modelInfo + safeAnswer;
      await sendLongMessage(
        ctx,
        (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
        finalMessage,
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      this.logger.error(`Error processing photo from user ${String(ctx.from?.id)}:`, error);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_file'));
      } catch { }
    }
  }
}

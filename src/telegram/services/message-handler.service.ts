import { Injectable } from '@nestjs/common';
import { Filter, InputFile } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { DEFAULT_MODEL, PROCESSING_STICKER_FILE_ID, MODELS_SUPPORTING_PHOTOS } from '../constants';
import { BotContext } from '../interfaces';
import { getModelDisplayName, sendLongMessage, stripCodeFences, escapeHtml, buildImageFooterByLang, stripBasicMarkdown, sendStickerWithRetry, sendChatActionWithRetry, deleteMessageWithRetry, sendPhotoWithRetry } from '../utils';

import { AccessControlService } from './access-control.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { TelegramFileService } from './telegram-file.service';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';
import { RequestBufferService } from './request-buffer.service';

@Injectable()
export class MessageHandlerService {
  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly telegramFileService: TelegramFileService,
    private readonly accessControlService: AccessControlService,
    private readonly setupAppService: SetupAppService,
    private readonly logger: WinstonLoggerService,
    private readonly requestBuffer: RequestBufferService,
  ) { }

  private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
    const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
    return this.i18n.t(key, userLang, args);
  }

  private buildImageFooter(ctx: BotContext, link?: string): string {
    const lang = (ctx as any)?.session?.lang || this.i18n.getDefaultLocale();
    return buildImageFooterByLang(lang, link);
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

      // Немедленный индикатор набора, чтобы дать пользователю фидбек
      await sendChatActionWithRetry(ctx.api as any, ctx.chat.id, 'typing');

      // Кладём фрагмент в буфер; через 3 секунды тишины произойдёт единый запрос
      this.requestBuffer.enqueue(userId, ctx as any, text, async (flushCtx, combinedText) => {
        await this.processBufferedText(flushCtx, combinedText);
      });
    } catch (error) {
      this.logger.error(`Error buffering message from user ${String(ctx.from?.id)}:`, error as any, MessageHandlerService.name);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_message'));
      } catch { }
    }
  }

  private async processBufferedText(ctx: BotContext, text: string): Promise<void> {
    const userId = String((ctx as any)?.from?.id);
    try {
      const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

      this.logger.log(`Processing combined text for user ${userId}, model: ${model}, length: ${text.length}`, MessageHandlerService.name);

      // Сохраняем комбинированный запрос в историю и получаем историю (включая этот запрос)
      await this.redisService.saveMessage(userId, 'user', text);
      const history = await this.redisService.getHistory(userId);

      let fileContent: string | undefined;
      let analyzingMessageId: number | null = null;
      const hasPendingFile = await this.telegramFileService.hasPendingFile(userId);
      try {
        if (hasPendingFile) {
          try {
            const msg = await (ctx as any).reply(this.t(ctx as any, 'file_analyzing'));
            analyzingMessageId = msg.message_id;
          } catch { }
        }

        const processed = await this.telegramFileService.consumeAllPendingFilesAndProcess(userId, ctx as any);
        if (processed.combinedContent) {
          fileContent = processed.combinedContent;
          this.logger.log(
            `Processed ${processed.count} file(s) for user ${userId}, combined length: ${fileContent.length} characters`,
            MessageHandlerService.name,
          );
        }
      } catch (fileError) {
        this.logger.error(`Error processing file for user ${userId}:`, fileError as any, MessageHandlerService.name);
        try { await (ctx as any).reply(this.t(ctx as any, 'error_processing_file_retry')); } catch { }
      } finally {
        if (analyzingMessageId) {
          try {
            const chatId = (ctx as any)?.chat?.id ?? (ctx as any)?.msg?.chat?.id;
            if (chatId) {
              await deleteMessageWithRetry((ctx as any).api, chatId, analyzingMessageId);
            }
          } catch { }
        }
      }

      this.logger.log(
        `Sending request to OpenRouter for user ${userId}, model: ${model}, history length: ${history.length}, has file: ${!!fileContent}`,
        MessageHandlerService.name,
      );

      const isFilePresent = !!fileContent && fileContent.length > 0;
      const priceMultiplier = isFilePresent ? 2 : 1;

      const accessResult = await this.accessControlService.checkAccess(
        ctx as any,
        userId,
        model,
        priceMultiplier,
      );
      if (!accessResult.canProceed) return;

      const price = accessResult.price;
      this.logger.log(
        `Will deduct ${price} SP for user ${userId} for model ${model}. isFilePresent: ${isFilePresent}`,
        MessageHandlerService.name,
      );

      const processingMessage = await (ctx as any).reply(this.t(ctx as any, 'processing_request'));
      let stickerMessageId: number | null = null;
      try {
        const stickerMessage = await sendStickerWithRetry((ctx as any).api, (ctx as any).chat.id, PROCESSING_STICKER_FILE_ID);
        stickerMessageId = (stickerMessage as any)?.message_id ?? null;
      } catch { }

      if (model === 'google/gemini-2.5-flash-image-preview') {
        void this.processImageGenerationRequest(ctx as any, {
          userId,
          model,
          prompt: text,
          price,
          processingMessageId: processingMessage.message_id,
          stickerMessageId: stickerMessageId ?? undefined,
        });
        return;
      }

      void this.processLlmRequest(ctx as any, {
        userId,
        model,
        history,
        fileContent,
        isFilePresent,
        price,
        processingMessageId: processingMessage.message_id,
        stickerMessageId: stickerMessageId ?? undefined,
      });
    } catch (error) {
      this.logger.error(`Error processing combined message from user ${userId}:`, error as any, MessageHandlerService.name);
      try { await (ctx as any).reply(this.t(ctx as any, 'error_processing_message')); } catch { }
    }
  }

  private async processImageGenerationRequest(
    ctx: BotContext,
    params: {
      userId: string;
      model: string;
      prompt: string;
      price: number;
      processingMessageId: number;
      stickerMessageId?: number;
    },
  ): Promise<void> {
    const { userId, model, prompt, price, processingMessageId, stickerMessageId } = params;
    try {
      await sendChatActionWithRetry((ctx as any).api, (ctx as any).chat.id, 'upload_photo');

      // Получаем последнее изображение для контекста (для всех моделей генерации изображений)
      const initImageDataUrl = await this.redisService.getLastImageDataUrl(userId) || undefined;

      let { images, text } = await this.openRouterService.generateOrEditImage(
        model,
        prompt,
        initImageDataUrl,
      );

      // Фолбэк: если модель не вернула изображения, пробуем ещё раз без initImageDataUrl
      if (!images || images.length === 0) {
        this.logger.warn(`Image gen returned no images for user ${userId}. Retrying without init image.`, MessageHandlerService.name);
        try {
          const retryPrompt = `${prompt}\n\nINSTRUCTIONS:\n- Generate a brand-new image strictly from the text above.\n- Ignore any previous/attached image.\n- If you cannot generate an image, reply with a concise text explanation of the reason.\n- If the prompt conflicts with safety, produce a benign, neutral scenic image matching a safe interpretation of the prompt or explain briefly why you cannot.`;
          const retry = await this.openRouterService.generateOrEditImage(
            model,
            retryPrompt,
            undefined,
          );
          if (retry?.images && retry.images.length > 0) {
            images = retry.images;
            text = retry.text ?? text;
          }
        } catch (retryErr) {
          this.logger.warn(`Image gen retry failed for user ${userId}: ${String((retryErr as Error)?.message || retryErr)}`, MessageHandlerService.name);
        }
      }

      // Списание SP
      try {
        await this.accessControlService.deductSPIfNeeded(userId, model, price, `Query to ${model} (image-gen)`);
      } catch (err) {
        this.logger.error(`Failed to deduct SP for user ${userId} (image-gen):`, err as any, MessageHandlerService.name);
      }

      // Сохраняем историю
      try {
        await this.redisService.saveMessage(userId, 'user', prompt);
        await this.redisService.saveMessage(userId, 'assistant', text || '[image]');
      } catch (err) {
        this.logger.error(`Failed to save messages for user ${userId} (image-gen):`, err as any, MessageHandlerService.name);
      }

      const modelDisplayName = getModelDisplayName(model);
      const modelLabel = this.t(ctx as any, 'model');
      const maxCaptionLen = 1024;
      let caption = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}`;

      const info = await this.setupAppService.getIntegrationInfo();
      const botUsername = (info as any)?.botUsername || '';
      const tgId = String((ctx as any)?.from?.id ?? userId);
      const link = botUsername ? `https://t.me/${botUsername}?start=${encodeURIComponent(tgId)}` : undefined;
      const footerCandidate = this.buildImageFooter(ctx as any, link);

      // Добавляем футер, если помещается целиком (не режем HTML)
      if (footerCandidate) {
        const remaining = maxCaptionLen - (caption.length + 2);
        if (remaining >= footerCandidate.length) {
          caption += `\n\n${footerCandidate}`;
        }
      }

      if (images && images.length > 0) {
        const first = images[0];
        const ext = first.mimeType === 'image/png' ? 'png' : first.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const inputFile = new InputFile(first.buffer, `gen.${ext}`);
        const replyTo = (ctx as any)?.message?.message_id ?? (ctx as any)?.msg?.message_id;
        await sendPhotoWithRetry((ctx as any).api, (ctx as any).chat.id, inputFile, { caption, parse_mode: 'HTML', reply_to_message_id: replyTo });

        // Сохраняем последнее сгенерированное изображение для контекста
        const imageDataUrl = `data:${first.mimeType};base64,${first.buffer.toString('base64')}`;
        await this.redisService.setLastImageDataUrl(userId, imageDataUrl);
      } else if (text) {
        await (ctx as any).reply(text);
      } else {
        await (ctx as any).reply(this.t(ctx as any, 'unexpected_error'));
      }
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const name = err?.name;
      const msg = String(err?.message || err || '');
      this.logger.error(`Image generation failed for user ${userId}: status=${status} name=${name} message=${msg}`, undefined, MessageHandlerService.name);
      try { await (ctx as any).reply(this.t(ctx as any, 'unexpected_error')); } catch { }
    } finally {
      try {
        const chatId = (ctx as any)?.chat?.id ?? (ctx as any)?.msg?.chat?.id;
        if (chatId) {
          await deleteMessageWithRetry((ctx as any).api, chatId, processingMessageId);
          if (typeof stickerMessageId === 'number') {
            try { await deleteMessageWithRetry((ctx as any).api, chatId, stickerMessageId); } catch { }
          }
        }
      } catch { }
    }
  }

  private async processLlmRequest(
    ctx: BotContext,
    params: {
      userId: string;
      model: string;
      history: Array<any>;
      fileContent?: string;
      isFilePresent: boolean;
      price: number;
      processingMessageId: number;
      stickerMessageId?: number;
    },
  ): Promise<void> {
    const { userId, model, history, fileContent, isFilePresent, price, processingMessageId, stickerMessageId } = params;
    let answer: string | undefined;
    try {
      // Добавляем последнее изображение как визуальный контекст ТОЛЬКО для моделей, поддерживающих фото
      const supportsPhotos = MODELS_SUPPORTING_PHOTOS.has(model as any);
      const contextImageDataUrl = supportsPhotos
        ? await this.redisService.getLastImageDataUrl(userId).catch(() => null)
        : null;
      answer = await this.openRouterService.ask(
        history,
        model,
        fileContent,
        (supportsPhotos ? contextImageDataUrl || undefined : undefined),
      );
    } catch (err: any) {
      const status = (err && err.status) || (err && err.response && err.response.status);
      const code = err?.code;
      const name = err?.name;
      const messageText = String(err?.message || err || '');
      const lower = messageText.toLowerCase();
      this.logger.error(
        `Error calling model for user ${userId}: code=${code} status=${status} name=${name} message=${messageText}`,
        undefined,
        MessageHandlerService.name,
      );

      try {
        if (
          (typeof status === 'number' && (status === 429 || status >= 500)) ||
          (name && String(name).toLowerCase().includes('timeout')) ||
          lower.includes('timeout') ||
          lower.includes('timed out') ||
          lower.includes('request timed out')
        ) {
          await ctx.reply(this.t(ctx as any, 'error_timeout'));
        } else {
          await ctx.reply(this.t(ctx as any, 'unexpected_error'));
        }
      } catch { }
      return;
    } finally {
      try {
        const chatId = (ctx as any)?.chat?.id ?? (ctx as any)?.msg?.chat?.id;
        if (chatId) {
          await deleteMessageWithRetry(ctx.api as any, chatId, processingMessageId);
          if (typeof stickerMessageId === 'number') {
            try { await deleteMessageWithRetry(ctx.api as any, chatId, stickerMessageId); } catch { }
          }
        }
      } catch { }
    }

    if (!answer) return;

    // Списание SP через AccessControlService
    const description = isFilePresent ? `Query to ${model} (file)` : `Query to ${model}`;
    try {
      await this.accessControlService.deductSPIfNeeded(userId, model, price, description);
    } catch (err) {
      this.logger.error(`Failed to deduct SP for user ${userId}:`, err as any, MessageHandlerService.name);
    }

    this.logger.log(
      `Received response from OpenRouter for user ${userId}, response length: ${answer.length}`,
      MessageHandlerService.name,
    );

    try {
      await this.redisService.saveMessage(userId, 'assistant', answer);
    } catch (err) {
      this.logger.error(`Failed to save assistant message for user ${userId}:`, err as any, MessageHandlerService.name);
    }

    const modelDisplayName = getModelDisplayName(model);
    const modelLabel = this.t(ctx as any, 'model');
    const modelInfo = `🤖 <b>${modelLabel}:</b> ${modelDisplayName}\n\n`;
    const cleaned = stripBasicMarkdown(stripCodeFences(answer));
    const safeAnswer = escapeHtml(cleaned);
    try {
      await sendLongMessage(
        ctx as any,
        (key: string, args?: Record<string, any>) => this.t(ctx as any, key, args),
        modelInfo + safeAnswer,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      this.logger.error(`Failed to send answer to user ${userId}:`, err as any, MessageHandlerService.name);
    }
  }

  async handleError(err: any) {
    this.logger.error('Unhandled bot error:', err as any, MessageHandlerService.name);
    try {
      await err.ctx.reply(this.t(err.ctx, 'unexpected_error'));
    } catch { }
  }
}

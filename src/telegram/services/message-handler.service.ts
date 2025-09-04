import { Injectable, Logger } from '@nestjs/common';
import { Filter } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { DEFAULT_MODEL } from '../constants';
import { BotContext } from '../interfaces';
import { getModelDisplayName, escapeMarkdown, sendLongMessage } from '../utils';

import { AccessControlService } from './access-control.service';
import { TelegramFileService } from './telegram-file.service';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly telegramFileService: TelegramFileService,
    private readonly accessControlService: AccessControlService,
  ) { }

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
      let analyzingMessageId: number | null = null;
      const hasPendingFile = await this.telegramFileService.hasPendingFile(userId);
      // Сообщение об анализе отправляем заранее и удаляем после завершения анализа
      try {
        if (hasPendingFile) {
          try {
            const msg = await ctx.reply(this.t(ctx, 'file_analyzing'));
            analyzingMessageId = msg.message_id;
          } catch { }
        }

        fileContent = await this.telegramFileService.consumeLatestFileAndProcess(userId, ctx);
        if (fileContent) {
          this.logger.log(
            `File processed successfully for user ${userId}, content length: ${fileContent.length} characters`,
          );
        }
      } catch (fileError) {
        this.logger.error(`Error processing file for user ${userId}:`, fileError);
        try {
          await ctx.reply(this.t(ctx, 'error_processing_file_retry'));
        } catch { }
      } finally {
        if (analyzingMessageId) {
          try {
            const chatId = (ctx as any)?.chat?.id ?? (ctx as any)?.msg?.chat?.id;
            if (chatId) {
              await ctx.api.deleteMessage(chatId, analyzingMessageId);
            }
          } catch { }
        }
      }

      this.logger.log(
        `Sending request to OpenRouter for user ${userId}, model: ${model}, history length: ${history.length}, has file: ${!!fileContent}`,
      );

      const isFilePresent = !!fileContent && fileContent.length > 0;
      const priceMultiplier = isFilePresent ? 2 : 1; // Удваиваем стоимость, если есть файл

      // Проверка доступа и лимитов через AccessControlService
      const accessResult = await this.accessControlService.checkAccess(
        ctx,
        userId,
        model,
        priceMultiplier,
      );
      if (!accessResult.canProceed) {
        return;
      }

      const price = accessResult.price;
      this.logger.log(
        `Will deduct ${price} SP for user ${userId} for model ${model}. isFilePresent: ${isFilePresent}`,
      );

      // Отправляем индикатор обработки перед запросом к модели
      const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));

      // Запускаем фоновую обработку без ожидания, чтобы не блокировать обработчик и event loop
      void this.processLlmRequest(ctx, {
        userId,
        model,
        history,
        fileContent,
        isFilePresent,
        price,
        processingMessageId: processingMessage.message_id,
      });
      return; // немедленно выходим из хэндлера
    } catch (error) {
      this.logger.error(`Error processing message from user ${String(ctx.from?.id)}:`, error);
      try {
        await ctx.reply(this.t(ctx, 'error_processing_message'));
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
    },
  ): Promise<void> {
    const { userId, model, history, fileContent, isFilePresent, price, processingMessageId } = params;
    let answer: string | undefined;
    try {
      answer = await this.openRouterService.ask(history, model, fileContent);
    } catch (err: any) {
      const status = (err && err.status) || (err && err.response && err.response.status);
      const code = err?.code;
      const name = err?.name;
      const messageText = String(err?.message || err || '');
      const lower = messageText.toLowerCase();
      this.logger.error(
        `Error calling model for user ${userId}: code=${code} status=${status} name=${name} message=${messageText}`,
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
          await ctx.api.deleteMessage(chatId, processingMessageId);
        }
      } catch { }
    }

    if (!answer) return;

    // Списание SP через AccessControlService
    const description = isFilePresent ? `Query to ${model} (file)` : `Query to ${model}`;
    try {
      await this.accessControlService.deductSPIfNeeded(userId, model, price, description);
    } catch (err) {
      this.logger.error(`Failed to deduct SP for user ${userId}:`, err);
    }

    this.logger.log(
      `Received response from OpenRouter for user ${userId}, response length: ${answer.length}`,
    );

    try {
      await this.redisService.saveMessage(userId, 'assistant', answer);
    } catch (err) {
      this.logger.error(`Failed to save assistant message for user ${userId}:`, err);
    }

    const modelDisplayName = getModelDisplayName(model);
    const modelInfo = ` 🤖 **${this.t(ctx as any, 'model')}:** ${modelDisplayName}\n\n`;
    const safeAnswer = escapeMarkdown(answer);
    try {
      await sendLongMessage(
        ctx as any,
        (key: string, args?: Record<string, any>) => this.t(ctx as any, key, args),
        modelInfo + safeAnswer,
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      this.logger.error(`Failed to send answer to user ${userId}:`, err);
    }
  }

  async handleError(err: any) {
    this.logger.error('Unhandled bot error:', err);
    try {
      await err.ctx.reply(this.t(err.ctx, 'unexpected_error'));
    } catch { }
  }
}

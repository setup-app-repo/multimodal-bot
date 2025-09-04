import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import csvParse from 'csv-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { Langfuse } from 'langfuse';

@Injectable()
export class OpenRouterService implements OnModuleDestroy {
  private readonly logger = new Logger(OpenRouterService.name);
  private client: OpenAI;
  private readonly requestTimeoutMs: number;
  private readonly maxAttemptsDefault: number;
  private readonly retryBaseMs: number;
  private readonly retryMaxMs: number;
  private langfuse?: Langfuse;

  constructor(private readonly configService: ConfigService) {
    this.requestTimeoutMs =
      Number(this.configService.get<string>('OPENROUTER_TIMEOUT_MS')) || 60000;
    this.maxAttemptsDefault =
      Number(this.configService.get<string>('OPENROUTER_MAX_ATTEMPTS')) || 3;
    this.retryBaseMs = Number(this.configService.get<string>('OPENROUTER_RETRY_BASE_MS')) || 500;
    this.retryMaxMs = Number(this.configService.get<string>('OPENROUTER_RETRY_MAX_MS')) || 5000;

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      // Дадим SDK базовые параметры устойчивости
      timeout: this.requestTimeoutMs, // на попытку
      maxRetries: 0, // собственные ретраи ниже
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('SITE_URL') || '',
        'X-Title': this.configService.get<string>('SITE_NAME') || '',
      },
    });

    // Langfuse init (необязательно; включится, если заданы ключи)
    const lfPublicKey = this.configService.get<string>('LANGFUSE_PUBLIC_KEY');
    const lfSecretKey = this.configService.get<string>('LANGFUSE_SECRET_KEY');
    const lfBaseUrl = this.configService.get<string>('LANGFUSE_BASE_URL');
    if (lfPublicKey && lfSecretKey) {
      try {
        this.langfuse = new Langfuse({
          publicKey: lfPublicKey,
          secretKey: lfSecretKey,
          baseUrl: lfBaseUrl || undefined,
        });
        this.logger.log('Langfuse initialized');
      } catch (e) {
        this.logger.warn(`Langfuse initialization failed: ${String((e as Error)?.message || e)}`);
      }
    } else {
      this.logger.log('Langfuse is not configured (no keys), skipping telemetry');
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      // Завершаем фоновые задачи SDK, если он инициализирован
      // Метод называется shutdownAsync в последних версиях SDK
      const anyLf: any = this.langfuse as any;
      if (anyLf && typeof anyLf.shutdownAsync === 'function') {
        await anyLf.shutdownAsync();
      }
    } catch (e) {
      this.logger.warn(`Langfuse shutdown failed: ${String((e as Error)?.message || e)}`);
    }
  }

  async askWithAudio(
    history: any[],
    model: string,
    base64Audio: string,
    format: 'wav' | 'mp3',
    prompt?: string,
  ): Promise<string> {
    this.logger.log(
      `Sending audio request to OpenRouter API, model: ${model}, history: ${history.length}, hasPrompt: ${!!prompt}, format: ${format}`,
    );

    const systemMessage = {
      role: 'system',
      content:
        'You are a chat assistant. I am sending you the last 20 messages from the user. Please respond to the latest message, taking into account the context of the previous messages.',
    };

    const messagesForModel: any[] = [systemMessage, ...history];

    const contentParts: any[] = [];
    // Gemini (через OpenRouter) требует хотя бы один text part в parts
    const textPrompt =
      prompt && prompt.trim().length > 0
        ? prompt
        : 'Please listen to this voice message and reply naturally, considering the chat history and user intent.';
    contentParts.push({ type: 'text', text: textPrompt });
    contentParts.push({
      type: 'input_audio',
      input_audio: {
        data: base64Audio,
        format,
      },
    });

    messagesForModel.push({ role: 'user', content: contentParts });

    const maxAttempts = this.maxAttemptsDefault;
    let attempt = 0;
    let lastError: any;

    const trace = this.langfuse?.trace({
      name: 'openrouter.askWithAudio',
      input: { historyLength: history.length, prompt: !!prompt, format },
      metadata: { provider: 'openrouter', modality: 'audio' },
    });

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const startTime = new Date();
        const generation = trace?.generation({
          name: 'chat.completions.create',
          model,
          input: messagesForModel,
          startTime,
          metadata: { provider: 'openrouter' },
        });

        const completion = await this.client.chat.completions.create(
          {
            model,
            messages: messagesForModel,
          },
          {
            timeout: this.requestTimeoutMs,
          },
        );

        const response = completion.choices[0].message?.content || '';
        this.logger.log(
          `Received response from OpenRouter API (audio), model: ${model}, response length: ${response.length}`,
        );
        try {
          generation?.update({
            output: response,
            endTime: new Date(),
            usage: completion.usage
              ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
              }
              : undefined,
          });
          trace?.update({ output: response });
        } catch { }
        return response;
      } catch (error: any) {
        lastError = error;
        const status =
          (error && error.status) || (error && error.response && error.response.status);
        const code = error?.code;
        const name = error?.name;
        const messageText = String(error?.message || error);

        const retriable = this.isRetriableError(code, status, messageText, name);
        if (!retriable || attempt >= maxAttempts) {
          this.logger.error(
            `Error calling OpenRouter API (audio), model: ${model}, attempt: ${attempt}/${maxAttempts}:`,
            error,
          );
          try {
            trace?.update({
              output: String(error?.message || error),
              metadata: { error: true },
            });
          } catch { }
          break;
        }

        const backoffMs = this.getBackoffWithJitter(attempt);
        this.logger.warn(
          `OpenRouter audio call failed (attempt ${attempt}/${maxAttempts}). Will retry in ${backoffMs}ms. Reason: code=${code} status=${status} message=${messageText}`,
        );
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  async askWithImages(
    history: any[],
    model: string,
    images: { mimeType: string; dataUrl: string }[],
    prompt?: string,
  ): Promise<string> {
    this.logger.log(
      `Sending multimodal request to OpenRouter API, model: ${model}, history: ${history.length}, images: ${images.length}, hasPrompt: ${!!prompt}`,
    );

    const systemMessage = {
      role: 'system',
      content:
        'You are a chat assistant. I am sending you the last 20 messages from the user. Please respond to the latest message, taking into account the context of the previous messages.',
    };

    const messagesForModel: any[] = [systemMessage, ...history];

    const contentParts: any[] = [];
    if (prompt && prompt.trim().length > 0) {
      contentParts.push({ type: 'text', text: prompt });
    }
    for (const img of images) {
      contentParts.push({ type: 'image_url', image_url: { url: img.dataUrl } });
    }

    messagesForModel.push({ role: 'user', content: contentParts });

    const maxAttempts = this.maxAttemptsDefault;
    let attempt = 0;
    let lastError: any;

    const trace = this.langfuse?.trace({
      name: 'openrouter.askWithImages',
      input: { historyLength: history.length, images: images.length, hasPrompt: !!prompt },
      metadata: { provider: 'openrouter', modality: 'multimodal' },
    });

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const startTime = new Date();
        const generation = trace?.generation({
          name: 'chat.completions.create',
          model,
          input: messagesForModel,
          startTime,
          metadata: { provider: 'openrouter' },
        });

        const completion = await this.client.chat.completions.create(
          {
            model,
            messages: messagesForModel,
          },
          {
            timeout: this.requestTimeoutMs,
          },
        );

        const response = completion.choices[0].message?.content || '';
        this.logger.log(
          `Received response from OpenRouter API (multimodal), model: ${model}, response length: ${response.length}`,
        );
        try {
          generation?.update({
            output: response,
            endTime: new Date(),
            usage: completion.usage
              ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
              }
              : undefined,
          });
          trace?.update({ output: response });
        } catch { }
        return response;
      } catch (error: any) {
        lastError = error;
        const status =
          (error && error.status) || (error && error.response && error.response.status);
        const code = error?.code;
        const name = error?.name;
        const messageText = String(error?.message || error);

        const retriable = this.isRetriableError(code, status, messageText, name);
        if (!retriable || attempt >= maxAttempts) {
          this.logger.error(
            `Error calling OpenRouter API (multimodal), model: ${model}, attempt: ${attempt}/${maxAttempts}:`,
            error,
          );
          try {
            trace?.update({
              output: String(error?.message || error),
              metadata: { error: true },
            });
          } catch { }
          break;
        }

        const backoffMs = this.getBackoffWithJitter(attempt);
        this.logger.warn(
          `OpenRouter multimodal call failed (attempt ${attempt}/${maxAttempts}). Will retry in ${backoffMs}ms. Reason: code=${code} status=${status} message=${messageText}`,
        );
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  async ask(message: any, model: string, fileContent?: string): Promise<string> {
    this.logger.log(
      `Sending request to OpenRouter API, model: ${model}, messages: ${message.length}, has file: ${!!fileContent}`,
    );

    const systemMessage = {
      role: 'system',
      content:
        'You are a chat assistant. I am sending you the last 20 messages from the user. Please respond to the latest message, taking into account the context of the previous messages.',
    };

    const messagesForModel = [systemMessage, ...message];

    // Если есть содержимое файла, добавляем его в контекст
    if (fileContent) {
      this.logger.log(
        `Adding file content to request, content length: ${fileContent.length} characters`,
      );
      const fileMessage = {
        role: 'user',
        content: `Содержимое загруженного файла:\n\n${fileContent}\n\nПожалуйста, проанализируй этот файл и ответь на вопрос пользователя.`,
      };
      messagesForModel.push(fileMessage);
    }

    const maxAttempts = this.maxAttemptsDefault;
    let attempt = 0;
    let lastError: any;

    const trace = this.langfuse?.trace({
      name: 'openrouter.ask',
      input: { hasFile: !!fileContent, messages: message?.length ?? 0 },
      metadata: { provider: 'openrouter', modality: 'text' },
    });

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const startTime = new Date();
        const generation = trace?.generation({
          name: 'chat.completions.create',
          model,
          input: messagesForModel,
          startTime,
          metadata: { provider: 'openrouter' },
        });

        const completion = await this.client.chat.completions.create(
          {
            model,
            messages: messagesForModel,
          },
          {
            timeout: this.requestTimeoutMs,
          },
        );

        const response = completion.choices[0].message?.content || '';
        this.logger.log(
          `Received response from OpenRouter API, model: ${model}, response length: ${response.length}`,
        );
        try {
          generation?.update({
            output: response,
            endTime: new Date(),
            usage: completion.usage
              ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
              }
              : undefined,
          });
          trace?.update({ output: response });
        } catch { }
        return response;
      } catch (error: any) {
        lastError = error;
        const status =
          (error && error.status) || (error && error.response && error.response.status);
        const code = error?.code;
        const name = error?.name;
        const messageText = String(error?.message || error);

        const retriable = this.isRetriableError(code, status, messageText, name);
        if (!retriable || attempt >= maxAttempts) {
          this.logger.error(
            `Error calling OpenRouter API, model: ${model}, attempt: ${attempt}/${maxAttempts}:`,
            error,
          );
          try {
            trace?.update({
              output: String(error?.message || error),
              metadata: { error: true },
            });
          } catch { }
          break;
        }

        const backoffMs = this.getBackoffWithJitter(attempt);
        this.logger.warn(
          `OpenRouter call failed (attempt ${attempt}/${maxAttempts}). Will retry in ${backoffMs}ms. Reason: code=${code} status=${status} message=${messageText}`,
        );
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  async processFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
    this.logger.log(
      `Processing file with mime type: ${mimeType}, buffer size: ${fileBuffer.length} bytes`,
    );

    try {
      let result: string;

      switch (mimeType) {
        case 'application/pdf':
          result = await this.extractPdfText(fileBuffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          result = await this.extractDocxText(fileBuffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          result = await this.extractPptxText(fileBuffer);
          break;
        case 'text/csv':
          result = await this.extractCsvText(fileBuffer);
          break;
        case 'text/plain':
          result = fileBuffer.toString('utf-8');
          break;
        case 'image/jpeg':
        case 'image/png':
        case 'image/webp':
          throw new Error(
            'Обработка изображений через OCR отключена. Отправьте фото напрямую в чат, без загрузки как документ.',
          );
        default:
          throw new Error(`Неподдерживаемый тип файла: ${mimeType}`);
      }

      this.logger.log(
        `File processed successfully, mime type: ${mimeType}, extracted text length: ${result.length} characters`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error processing file, mime type: ${mimeType}:`, error);
      throw new Error(`Ошибка при обработке файла: ${error.message}`);
    }
  }

  // OCR удалён: изображения нужно отправлять напрямую как фото, а не документ

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text || 'Текст не найден в PDF файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из PDF: ${error.message}`);
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'Текст не найден в DOCX файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из DOCX: ${error.message}`);
    }
  }

  private async extractPptxText(buffer: Buffer): Promise<string> {
    try {
      // Для PPTX используем mammoth с опцией для презентаций
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'Текст не найден в PPTX файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из PPTX: ${error.message}`);
    }
  }

  private async extractCsvText(buffer: Buffer): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const text = buffer.toString('utf-8');
        csvParse.parse(
          text,
          {
            columns: true,
            skip_empty_lines: true,
          },
          (err, records) => {
            if (err) {
              reject(new Error(`Ошибка при парсинге CSV: ${err.message}`));
              return;
            }

            if (!records || records.length === 0) {
              resolve('CSV файл пуст или не содержит данных');
              return;
            }

            // Форматируем CSV в читаемый вид
            const formattedText = records
              .map((record: any, index: number) => {
                const rowText = Object.entries(record)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ');
                return `Строка ${index + 1}: ${rowText}`;
              })
              .join('\n');

            resolve(formattedText);
          },
        );
      });
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из CSV: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getBackoffWithJitter(attempt: number): number {
    const base = this.retryBaseMs;
    const max = this.retryMaxMs;
    const expo = Math.min(max, base * Math.pow(2, attempt - 1));
    const jitter = Math.floor(Math.random() * Math.floor(base / 2));
    return expo + jitter;
  }

  private isRetriableError(
    code?: string,
    status?: number,
    message?: string,
    name?: string,
  ): boolean {
    // HTTP статусы: 429, 500-599 — ретраим
    if (typeof status === 'number' && (status === 429 || status >= 500)) return true;
    // Сетевые ошибки undici / node
    const lower = (message || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();
    if (
      code === 'UND_ERR_SOCKET' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'UND_ERR_HEADERS_TIMEOUT' ||
      code === 'UND_ERR_BODY_TIMEOUT' ||
      code === 'UND_ERR_RESPONSE_TIMEOUT' ||
      code === 'ECONNRESET' ||
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    )
      return true;
    if (
      nameLower.includes('timeout') ||
      lower.includes('timeout') ||
      lower.includes('timed out') ||
      lower.includes('request timed out') ||
      lower.includes('terminated') ||
      lower.includes('socket hang up') ||
      lower.includes('other side closed') ||
      lower.includes('fetch failed') ||
      lower.includes('network error')
    )
      return true;
    return false;
  }
}

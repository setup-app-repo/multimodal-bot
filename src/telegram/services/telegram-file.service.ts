import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { BotContext } from '../interfaces';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class TelegramFileService {
  constructor(
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) { }

  async hasPendingFile(userId: string): Promise<boolean> {
    try {
      const queued = await this.redisService.lrangeAll(`file:${userId}:queue`).catch(() => [] as string[]);
      if (Array.isArray(queued) && queued.length > 0) return true;
      // Legacy fallback (на случай старых данных)
      const latestKey = await this.redisService.get<string>(`file:${userId}:latest`);
      if (!latestKey) return false;
      const fileInfoStr = await this.redisService.get<string>(latestKey);
      return !!fileInfoStr;
    } catch (error) {
      this.logger.error(`Error checking pending file for user ${userId}:`, error as any, TelegramFileService.name);
      return false;
    }
  }

  async saveFileMeta(
    userId: string,
    meta: {
      fileId: string;
      fileName?: string;
      mimeType: string;
      fileSize?: number;
      timestamp?: number;
    },
    ttlSeconds: number = 3600,
  ): Promise<void> {
    const key = `file:${userId}:${meta.fileId}`;
    const payload = JSON.stringify({
      ...meta,
      timestamp: meta.timestamp ?? Date.now(),
    });
    await this.redisService.set(key, payload, ttlSeconds);
    // Кладём ключ в очередь файлов пользователя
    try {
      await this.redisService.rpush(`file:${userId}:queue`, key);
      await this.redisService.expire(`file:${userId}:queue`, ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to push file key to queue for user ${userId}: ${String(err)}`, TelegramFileService.name);
      // Fallback: сохраняем указатель на последний файл (legacy)
      await this.redisService.set(`file:${userId}:latest`, key, ttlSeconds);
    }
    this.logger.log(`Saved file meta for user ${userId}, key: ${key}`, TelegramFileService.name);
  }

  async consumeLatestFileAndProcess(userId: string, ctx: BotContext): Promise<string | undefined> {
    try {
      const latestKey = await this.redisService.get<string>(`file:${userId}:latest`);
      if (!latestKey) return undefined;

      const fileInfoStr = await this.redisService.get<string>(latestKey);
      if (!fileInfoStr) return undefined;

      const fileInfo = JSON.parse(fileInfoStr) as {
        fileId: string;
        fileName?: string;
        mimeType: string;
      };
      const fileId = fileInfo.fileId;

      this.logger.log(
        `Processing file ${fileInfo.fileName ?? fileId} (${fileInfo.mimeType}) for user ${userId}`,
        TelegramFileService.name,
      );

      const file = await ctx.api.getFile(fileId);
      if (!file?.file_path) return undefined;

      const token = this.configService.get<string>('BOT_TOKEN');
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const fileBuffer = Buffer.from(await response.arrayBuffer());

      const content = await this.openRouterService.processFile(fileBuffer, fileInfo.mimeType);

      // Удаляем указатель и данные файла
      await this.redisService.del(latestKey);
      await this.redisService.del(`file:${userId}:latest`);

      return content;
    } catch (error) {
      this.logger.error(`Error processing latest file for user ${userId}:`, error as any, TelegramFileService.name);
      return undefined;
    }
  }

  /**
   * Обрабатывает ВСЕ ожидающие файлы пользователя, объединяя их содержимое в один текстовый блок.
   * Возвращает объединённый контент и количество обработанных файлов.
   */
  async consumeAllPendingFilesAndProcess(
    userId: string,
    ctx: BotContext,
  ): Promise<{ combinedContent?: string; count: number }> {
    try {
      const queueKey = `file:${userId}:queue`;
      const allKeys = (await this.redisService.lrangeAll(queueKey)) || [];
      if (!allKeys.length) {
        // legacy fallback: обработать latest если остался
        const legacy = await this.consumeLatestFileAndProcess(userId, ctx);
        if (legacy) {
          return { combinedContent: legacy, count: 1 };
        }
        return { combinedContent: undefined, count: 0 };
      }

      const parts: string[] = [];
      let processed = 0;

      for (const key of allKeys) {
        const fileInfoStr = await this.redisService.get<string>(key);
        if (!fileInfoStr) continue;
        const fileInfo = JSON.parse(fileInfoStr) as {
          fileId: string;
          fileName?: string;
          mimeType: string;
        };
        const file = await ctx.api.getFile(fileInfo.fileId);
        if (!file?.file_path) continue;
        const token = this.configService.get<string>('BOT_TOKEN');
        const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        const response = await fetch(fileUrl);
        const fileBuffer = Buffer.from(await response.arrayBuffer());
        const content = await this.openRouterService.processFile(fileBuffer, fileInfo.mimeType);
        const header = `===== FILE: ${fileInfo.fileName || fileInfo.fileId} (${fileInfo.mimeType}) =====`;
        parts.push(`${header}\n\n${content}`);
        processed += 1;
        // удаляем мету файла
        await this.redisService.del(key);
      }

      // очищаем очередь
      await this.redisService.del(queueKey);

      if (processed === 0) {
        return { combinedContent: undefined, count: 0 };
      }
      const combinedContent = parts.join('\n\n---\n\n');
      return { combinedContent, count: processed };
    } catch (error) {
      this.logger.error(`Error processing pending files for user ${userId}:`, error as any, TelegramFileService.name);
      return { combinedContent: undefined, count: 0 };
    }
  }
}

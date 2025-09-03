import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { RedisService } from 'src/redis/redis.service';

import { BotContext } from '../interfaces';

@Injectable()
export class TelegramFileService {
  private readonly logger = new Logger(TelegramFileService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly openRouterService: OpenRouterService,
    private readonly configService: ConfigService,
  ) {}

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
    // Также сохраняем "указатель" на последний файл пользователя, чтобы не делать KEYS
    await this.redisService.set(`file:${userId}:latest`, key, ttlSeconds);
    this.logger.log(`Saved file meta for user ${userId}, key: ${key}`);
  }

  async consumeLatestFileAndProcess(
    userId: string,
    ctx: BotContext,
  ): Promise<string | undefined> {
    try {
      const latestKey = await this.redisService.get<string>(
        `file:${userId}:latest`,
      );
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
      );

      const file = await ctx.api.getFile(fileId);
      if (!file?.file_path) return undefined;

      const token = this.configService.get<string>('BOT_TOKEN');
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const response = await fetch(fileUrl);
      const fileBuffer = Buffer.from(await response.arrayBuffer());

      const content = await this.openRouterService.processFile(
        fileBuffer,
        fileInfo.mimeType,
      );

      // Удаляем указатель и данные файла
      await this.redisService.del(latestKey);
      await this.redisService.del(`file:${userId}:latest`);

      return content;
    } catch (error) {
      this.logger.error(
        `Error processing latest file for user ${userId}:`,
        error,
      );
      return undefined;
    }
  }
}

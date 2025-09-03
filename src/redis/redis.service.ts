import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly CHAT_TTL = 60 * 60;
  private readonly MAX_HISTORY = 20;
  private readonly HISTORY_RETENTION_DAYS = 50;
  private readonly MAX_HISTORY_CHARS = 30000;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.client = new Redis(redisUrl);
    }
  }

  // Поддерживается как REDIS_URL, так и раздельные переменные для обратной совместимости
  private getKey(userId: string) {
    return `chat:${userId}:history`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async cleanupOldHistory() {
    try {
      console.log('Starting daily history cleanup...');
      const cutoffTime = Date.now() - this.HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const pattern = 'chat:*:history';
      const keys = await this.client.keys(pattern);

      let cleanedCount = 0;
      for (const key of keys) {
        const history = await this.client.lrange(key, 0, -1);
        const filteredHistory: string[] = [];

        for (const msg of history) {
          try {
            const parsed = JSON.parse(msg);
            if (parsed.timestamp && parsed.timestamp > cutoffTime) {
              filteredHistory.push(msg);
            }
          } catch (e) {
            // Пропускаем некорректные сообщения
            continue;
          }
        }

        // Если есть изменения, обновляем историю
        if (filteredHistory.length !== history.length) {
          await this.client.del(key);
          if (filteredHistory.length > 0) {
            await this.client.rpush(key, ...filteredHistory);
            await this.client.expire(key, this.CHAT_TTL);
          }
          cleanedCount++;
        }
      }
      console.log(`History cleanup completed. Cleaned ${cleanedCount} chat histories.`);
    } catch (error) {
      console.error('Error during history cleanup:', error);
    }
  }

  async saveMessage(userId: string, role: 'user' | 'assistant', content: string) {
    const key = this.getKey(userId);
    const limitedContent =
      typeof content === 'string' && content.length > this.MAX_HISTORY_CHARS
        ? content.slice(0, this.MAX_HISTORY_CHARS)
        : content;
    const data = JSON.stringify({ role, content: limitedContent });

    await this.client.rpush(key, data);
    await this.client.ltrim(key, -this.MAX_HISTORY, -1);

    // Применяем жёсткий лимит по суммарной длине контента (30k символов)
    try {
      const entries = await this.client.lrange(key, 0, -1);

      let totalChars = 0;
      const parsed = entries.map((raw) => {
        try {
          const obj = JSON.parse(raw);
          const len = typeof obj?.content === 'string' ? obj.content.length : 0;
          totalChars += len;
          return obj as { role?: 'user' | 'assistant'; content?: string };
        } catch {
          return { role: undefined, content: '' } as {
            role?: 'user' | 'assistant';
            content?: string;
          };
        }
      });

      if (totalChars > this.MAX_HISTORY_CHARS) {
        let toRemove = 0;
        let remainingChars = totalChars;
        let idx = 0;
        while (remainingChars > this.MAX_HISTORY_CHARS && idx < parsed.length) {
          // Удаляем старыe записи слева; стараемся удалять парами (user+assistant)
          const first = parsed[idx];
          const firstLen = typeof first?.content === 'string' ? first.content.length : 0;
          remainingChars -= firstLen;
          toRemove += 1;
          idx += 1;

          if (
            remainingChars > this.MAX_HISTORY_CHARS &&
            first?.role === 'user' &&
            idx < parsed.length
          ) {
            const maybeAnswer = parsed[idx];
            if (maybeAnswer?.role === 'assistant') {
              const secondLen =
                typeof maybeAnswer?.content === 'string' ? maybeAnswer.content.length : 0;
              remainingChars -= secondLen;
              toRemove += 1;
              idx += 1;
            }
          }
        }

        if (toRemove > 0) {
          try {
            // Redis 6.2+ поддерживает LPOP с количеством
            // @ts-ignore
            await this.client.lpop(key, toRemove as any);
          } catch {
            for (let i = 0; i < toRemove; i++) {
              await this.client.lpop(key);
            }
          }
        }
      }
    } catch { }

    await this.client.expire(key, this.CHAT_TTL);
  }

  async getHistory(userId: string) {
    const key = this.getKey(userId);
    const history = await this.client.lrange(key, 0, -1);
    return history.map((msg) => JSON.parse(msg));
  }

  async clearHistory(userId: string) {
    await this.client.del(this.getKey(userId));
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    const data = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.set(key, data, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * Возвращает количество секунд до ближайшей полуночи (локальное серверное время)
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const seconds = Math.ceil((midnight.getTime() - now.getTime()) / 1000);
    return seconds > 0 ? seconds : 60 * 60 * 24;
  }

  /**
   * Инкрементирует суточный счетчик бесплатных запросов BASE для пользователя.
   * Ключ истекает в полночь.
   * Возвращает текущее значение после инкремента.
   */
  async incrementDailyBaseCount(userId: string): Promise<number> {
    const key = `limit:${userId}:base_daily_count`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, this.getSecondsUntilMidnight());
    }
    return count;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly CHAT_TTL = 60 * 60;
  private readonly MAX_HISTORY = 20;
  private readonly HISTORY_RETENTION_DAYS = 50;

  constructor(private readonly configService: ConfigService) {
    // const redisUrl = this.configService.get<string>('REDIS_URL');

    // if (redisUrl) {
    //   // Пример: redis://:@127.0.0.1:6379/0 (пустой пароль и база 0)
    //   this.client = new Redis(redisUrl);
    // } else {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
        port: this.configService.get<number>('REDIS_PORT') || 6379,
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB') || 0,
      });
    // }
  }

  // Поддерживается как REDIS_URL, так и раздельные переменные для обратной совместимости

  private getKey(userId: string) {
    return `chat:${userId}:history`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async cleanupOldHistory() {
    try {
      console.log('Starting daily history cleanup...');
      const cutoffTime = Date.now() - (this.HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const pattern = 'chat:*:history';
      const keys = await this.client.keys(pattern);
      
      let cleanedCount = 0;
      for (const key of keys) {
        const history = await this.client.lrange(key, 0, -1);
        const filteredHistory: string[] = [];
        
        for (const msg of history) {
          try {
            const parsed = JSON.parse(msg);
            console.log(parsed);
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
    const data = JSON.stringify({ role, content });

    await this.client.rpush(key, data);
    await this.client.ltrim(key, -this.MAX_HISTORY, -1);
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

  async onModuleDestroy() {
    await this.client.quit();
  }
}

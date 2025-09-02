import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly configService: ConfigService) {
    this.validateInput();
  }

  private validateInput(): void {
    const schema = Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      PORT: Joi.number().default(3000),
      BOT_TOKEN: Joi.string().required(),

      // Database URL (preferred)
      DATABASE_URL: Joi.string()
        .uri({ scheme: [/postgres/, /postgresql/] })
        .required(),

      // // Postgres
      // DB_HOST: Joi.string().default('localhost'),
      // DB_PORT: Joi.number().default(5432),
      // DB_USER: Joi.string().default('user'),
      // DB_PASSWORD: Joi.string().default('user'),
      // DB_NAME: Joi.string().default('multimodal'),

      // Redis
      REDIS_HOST: Joi.string().default('127.0.0.1'),
      REDIS_PORT: Joi.number().default(6379),
      REDIS_PASSWORD: Joi.string().optional().allow(''),
      REDIS_DB: Joi.number().default(0),

      // OpenRouter / site meta
      OPENROUTER_API_KEY: Joi.string().required(),
      SITE_URL: Joi.string().uri().optional(),
      SITE_NAME: Joi.string().optional(),
      OPENROUTER_TIMEOUT_MS: Joi.number().default(60000),
      OPENROUTER_MAX_ATTEMPTS: Joi.number().default(3),
      OPENROUTER_RETRY_BASE_MS: Joi.number().default(500),
      OPENROUTER_RETRY_MAX_MS: Joi.number().default(5000),
      
      // Localization
      FALLBACK_LANGUAGE: Joi.string().default('ru'),
    });

    const { error } = schema.validate(process.env, { allowUnknown: true });
    if (error) {
      this.logger.error(`Configuration validation error: ${error.message}`);
      throw new Error(`Configuration validation error: ${error.message}`);
    }
  }

  private get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key not found: ${key}`);
    }
    return value;
  }

  get port(): number {
    return this.get<number>('PORT');
  }

  get botToken(): string {
    return this.get<string>('BOT_TOKEN');
  }

  get dbHost(): string { return new URL(this.get<string>('DATABASE_URL')).hostname; }
  get dbPort(): number { return Number(new URL(this.get<string>('DATABASE_URL')).port || 5432); }
  get dbUser(): string { return new URL(this.get<string>('DATABASE_URL')).username; }
  get dbPassword(): string { return new URL(this.get<string>('DATABASE_URL')).password; }
  get dbName(): string { return new URL(this.get<string>('DATABASE_URL')).pathname.replace(/^\//, ''); }

  get redisHost(): string { return this.get<string>('REDIS_HOST'); }
  get redisPort(): number { return this.get<number>('REDIS_PORT'); }
  get redisPassword(): string | undefined { return this.configService.get<string>('REDIS_PASSWORD'); }
  get redisDb(): number { return this.get<number>('REDIS_DB'); }

  get openRouterApiKey(): string { return this.get<string>('OPENROUTER_API_KEY'); }
  get siteUrl(): string | undefined { return this.configService.get<string>('SITE_URL'); }
  get siteName(): string | undefined { return this.configService.get<string>('SITE_NAME'); }
  
  get fallbackLanguage(): string { 
    // Устанавливаем значение по умолчанию, если переменная окружения не задана
    return this.configService.get<string>('FALLBACK_LANGUAGE') || 'ru'; 
  }
}



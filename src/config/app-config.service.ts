import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService, private readonly logger: WinstonLoggerService) {
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
      DATABASE_SSL: Joi.string()
        .valid('enabled', 'disabled', 'auto', 'true', 'false')
        .optional(),

      // OpenRouter / site meta
      OPENROUTER_API_KEY: Joi.string().required(),
      SITE_URL: Joi.string().uri().optional(),
      SITE_NAME: Joi.string().optional(),
      OPENROUTER_TIMEOUT_MS: Joi.number().default(60000),
      OPENROUTER_MAX_ATTEMPTS: Joi.number().default(3),
      OPENROUTER_RETRY_BASE_MS: Joi.number().default(500),
      OPENROUTER_RETRY_MAX_MS: Joi.number().default(5000),

      // Langfuse (опционально)
      LANGFUSE_PUBLIC_KEY: Joi.string().optional(),
      LANGFUSE_SECRET_KEY: Joi.string().optional(),
      LANGFUSE_BASE_URL: Joi.string().uri().optional(),

      // Sentry
      SENTRY_DSN: Joi.string().uri().allow('', null).optional(),
      SENTRY_DEBUG: Joi.string().valid('true', 'false').optional(),
      SENTRY_VERBOSE: Joi.string().valid('true', 'false').optional(),
      SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),
      SENTRY_PROFILES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),

      // Datadog
      DD_ENABLED: Joi.boolean().optional(),
      DD_SERVICE: Joi.string().optional(),
      DD_AGENT_HOST: Joi.string().uri().optional(),
      DD_ENV: Joi.string().optional(),
      DD_VERSION: Joi.string().optional(),
      DD_TRACE_AGENT_PORT: Joi.alternatives(Joi.number(), Joi.string()).optional(),
      DD_TRACE_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),

      // Redis / BullMQ
      REDIS_URL: Joi.string().uri({ scheme: [/redis/, /rediss/] }).required(),

      // Telegram webhook (опционально, для webhook-режима)
      TELEGRAM_WEBHOOK_URL: Joi.string().uri().optional(),
      TELEGRAM_SECRET_KEY: Joi.string().optional(),

      // Setup.app интеграция
      SETUP_APP_BASE_URL: Joi.string().uri().required(),
      SETUP_APP_SERVICE_KEY: Joi.string().required(),
      SETUP_APP_ENABLE_LOGGING: Joi.string().valid('true', 'false').optional(),

      // Логирование
      LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
        .required(),
    });

    const { error } = schema.validate(process.env, { allowUnknown: true });
    if (error) {
      this.logger.error(`Configuration validation error: ${error.message}`, undefined, 'AppConfigService');
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

  get nodeEnv(): string {
    return this.get<string>('NODE_ENV');
  }

  get dbHost(): string {
    return new URL(this.get<string>('DATABASE_URL')).hostname;
  }
  get dbPort(): number {
    return Number(new URL(this.get<string>('DATABASE_URL')).port || 5432);
  }
  get dbUser(): string {
    return new URL(this.get<string>('DATABASE_URL')).username;
  }
  get dbPassword(): string {
    return new URL(this.get<string>('DATABASE_URL')).password;
  }
  get dbName(): string {
    return new URL(this.get<string>('DATABASE_URL')).pathname.replace(/^\//, '');
  }

  // Sentry
  get sentryDsn(): string | undefined {
    return this.configService.get<string>('SENTRY_DSN') || undefined;
  }

  get sentryDebug(): boolean {
    return this.configService.get<string>('SENTRY_DEBUG') === 'true';
  }

  get sentryVerbose(): boolean {
    return this.configService.get<string>('SENTRY_VERBOSE') === 'true';
  }

  get sentryTracesSampleRate(): number | undefined {
    const v = this.configService.get<string>('SENTRY_TRACES_SAMPLE_RATE');
    return typeof v === 'string' ? Number(v) : undefined;
  }

  get sentryProfilesSampleRate(): number | undefined {
    const v = this.configService.get<string>('SENTRY_PROFILES_SAMPLE_RATE');
    return typeof v === 'string' ? Number(v) : undefined;
  }

  get datadogEnabled(): boolean | undefined {
    const v = this.configService.get<any>('DD_ENABLED');
    // допускаем строковые значения из env
    if (typeof v === 'string') return v === 'true';
    if (typeof v === 'boolean') return v;
    return undefined;
  }

  get datadogService(): string | undefined {
    return this.configService.get<string>('DD_SERVICE') || undefined;
  }

  get datadogUrl(): string | undefined {
    return this.configService.get<string>('DD_AGENT_HOST') || undefined;
  }

  get datadogEnv(): string | undefined {
    return this.configService.get<string>('DD_ENV') || undefined;
  }

  get datadogTracesSampleRate(): number | undefined {
    const v = this.configService.get<any>('DD_TRACE_SAMPLE_RATE');
    if (typeof v === 'string') return Number(v);
    if (typeof v === 'number') return v;
    return undefined;
  }
}

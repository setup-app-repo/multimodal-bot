import { existsSync } from 'fs';
import { join } from 'path';

import { I18n } from '@grammyjs/i18n';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { II18nService, I18nConfig } from './interfaces';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class I18nService implements II18nService {
  private readonly i18n: I18n;
  private readonly config: I18nConfig;

  constructor(private readonly configService: ConfigService, private readonly logger: WinstonLoggerService) {
    const cwd = process.cwd();
    const distLocalesPath = join(cwd, 'dist', 'locales');
    const srcLocalesPath = join(cwd, 'src', 'i18n', 'locales');
    const resolvedLocalesPath = existsSync(distLocalesPath) ? distLocalesPath : srcLocalesPath;

    this.config = {
      defaultLocale: this.configService.get<string>('FALLBACK_LANGUAGE', 'ru'),
      supportedLocales: ['ru', 'en', 'es', 'de', 'pt', 'fr', 'vi'],
      localesPath: resolvedLocalesPath,
    };

    this.i18n = new I18n({
      defaultLocale: this.config.defaultLocale,
      useSession: true, // Используем сессии для хранения локали пользователя
      directory: this.config.localesPath,
    });

    this.logger.log(`I18n initialized with default locale: ${this.config.defaultLocale}`, I18nService.name);
    this.logger.log(`Supported locales: ${this.config.supportedLocales.join(', ')}`, I18nService.name);
    this.logger.log(`Locales directory: ${this.config.localesPath}`, I18nService.name);
  }

  /**
   * Получить перевод по ключу
   */
  t(key: string, locale?: string, args?: Record<string, any>): string {
    try {
      const targetLocale = this.normalizeLocale(locale);

      // Конвертируем ключ из dot-notation в kebab-case для FTL
      const ftlKey = this.convertKeyToFtl(key);

      // this.logger.debug(`Translating key: ${key} -> ${ftlKey} (locale: ${targetLocale})`);

      // Используем Grammy i18n для получения перевода
      const translation = this.i18n.t(targetLocale, ftlKey, args || {});

      // this.logger.debug(`Translation result: ${translation}`);

      if (!translation || translation === ftlKey) {
        this.logger.warn(
          `Missing translation for key: ${ftlKey} (original: ${key}, locale: ${targetLocale})`,
          I18nService.name,
        );
        // Fallback на английский, если перевод не найден
        if (targetLocale !== this.config.defaultLocale) {
          const fallbackTranslation = this.i18n.t(this.config.defaultLocale, ftlKey, args || {});
          if (fallbackTranslation && fallbackTranslation !== ftlKey) {
            return fallbackTranslation;
          }
        }
        // Возвращаем исходный ключ без "messages." префикса
        return key.replace('messages.', '');
      }

      return translation;
    } catch (error) {
      // Правильное логирование ошибки для Winston
      if (error instanceof Error) {
        this.logger.error(
          `Error getting translation for key ${key}: ${error.message}`,
          error.stack,
          I18nService.name,
        );
      } else {
        this.logger.error(
          `Error getting translation for key ${key} (unknown error type):`,
          String(error),
          I18nService.name,
        );
      }
      return key.replace('messages.', ''); // Возвращаем читаемый ключ
    }
  }

  /**
   * Получить поддерживаемые локали
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Проверить, поддерживается ли локаль
   */
  isLocaleSupported(locale: string): boolean {
    const normalized = locale.toLowerCase().split('-')[0];
    return this.config.supportedLocales.includes(normalized);
  }

  /**
   * Получить локаль по умолчанию
   */
  getDefaultLocale(): string {
    return this.config.defaultLocale;
  }

  /**
   * Нормализовать локаль (ru-RU -> ru)
   */
  private normalizeLocale(locale?: string): string {
    if (!locale) {
      return this.config.defaultLocale;
    }

    const normalized = locale.toLowerCase().split('-')[0];
    return this.config.supportedLocales.includes(normalized)
      ? normalized
      : this.config.defaultLocale;
  }

  /**
   * Конвертировать ключ из dot-notation в kebab-case для FTL
   * Пример: "messages.welcome.text" -> "welcome-text"
   */
  private convertKeyToFtl(key: string): string {
    // Убираем префикс "messages." если есть
    const withoutPrefix = key.startsWith('messages.') ? key.replace('messages.', '') : key;

    // Конвертируем в kebab-case
    return withoutPrefix.replace(/\./g, '-');
  }
}

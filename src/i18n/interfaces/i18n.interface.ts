/**
 * Интерфейс для работы с переводами
 */
export interface II18nService {
    /**
     * Получить перевод по ключу
     * @param key - ключ перевода (kebab-case)
     * @param locale - локаль (ru, en)
     * @param args - аргументы для подстановки
     */
    t(key: string, locale?: string, args?: Record<string, any>): string;
  
    /**
     * Получить поддерживаемые локали
     */
    getSupportedLocales(): string[];
  
    /**
     * Проверить, поддерживается ли локаль
     */
    isLocaleSupported(locale: string): boolean;
  
    /**
     * Получить локаль по умолчанию
     */
    getDefaultLocale(): string;
  }
  
  /**
   * Конфигурация i18n
   */
  export interface I18nConfig {
    defaultLocale: string;
    supportedLocales: string[];
    localesPath: string;
  }
  
export const models = [
  'openai/gpt-5',
  'google/gemini-2.5-flash-image-preview', // Gemini 2.5 Image
  'anthropic/claude-3.7-sonnet',
  'x-ai/grok-4',
  'google/gemini-2.5-pro',
  'deepseek/deepseek-chat-v3.1',
  'qwen/qwen2.5-vl-32b-instruct',
  'openai/gpt-4o-mini',
];

// Модель по умолчанию (бесплатная)
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/csv',
  'text/plain',
]);

// Расширения файлов (без точки) для унификации проверок
export const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
export const DOC_EXTENSIONS = new Set(['pdf', 'docx', 'pptx', 'csv', 'txt']);

// Маппинг расширений изображений в корректные MIME-типы
export const IMAGE_EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Модели, поддерживающие работу с файлами (валидируем перед отправкой)
export const MODELS_SUPPORTING_FILES = new Set<string>([
  'openai/gpt-5',
  'openai/gpt-4o-mini',
  'qwen/qwen2.5-vl-32b-instruct',
  'anthropic/claude-3.7-sonnet',
  'google/gemini-2.5-pro',
]);

// Стоимость (SP/запрос) по умолчанию указываем как стоимость без подписки по уровню
// Итоговая стоимость для пользователя берётся через getPriceSP(model, hasActiveSub)
export const MODEL_INFO: Record<string, { price: number; power: number }> = {
  // Top
  'openai/gpt-5': { price: 0.03, power: 100 },
  'anthropic/claude-3.7-sonnet': { price: 0.03, power: 85 },
  'google/gemini-2.5-pro': { price: 0.03, power: 75 },
  // Mid
  'x-ai/grok-4': { price: 0.013, power: 75 },
  'deepseek/deepseek-chat-v3.1': { price: 0.013, power: 85 },
  'google/gemini-2.5-flash-image-preview': { price: 0.013, power: 100 },
  'qwen/qwen2.5-vl-32b-instruct': { price: 0.013, power: 50 },
  // Base
  'openai/gpt-4o-mini': { price: 0, power: 20 },
};

// Индивидуальные цены (SP/запрос) для каждой модели
export const MODEL_PRICES_SP: Record<string, { withSub: number; withoutSub: number }> = {
  'openai/gpt-5': { withoutSub: 0.03, withSub: 0.02 },
  'google/gemini-2.5-flash-image-preview': { withoutSub: 0.05, withSub: 0.03 },
  'anthropic/claude-3.7-sonnet': { withoutSub: 0.03, withSub: 0.02 },
  'x-ai/grok-4': { withoutSub: 0.03, withSub: 0.01 },
  'google/gemini-2.5-pro': { withoutSub: 0.02, withSub: 0.01 },
  'deepseek/deepseek-chat-v3.1': { withoutSub: 0.03, withSub: 0.01 },
  'qwen/qwen2.5-vl-32b-instruct': { withoutSub: 0.02, withSub: 0.01 },
  'openai/gpt-4o-mini': { withoutSub: 0, withSub: 0 },
};

// Тарифные уровни моделей для тарификации запросов
export enum ModelTier {
  BASE = 'BASE',
  MID = 'MID',
  TOP = 'TOP',
}

// Соответствие модели тарифному уровню
export const MODEL_TO_TIER: Record<string, ModelTier> = {
  'openai/gpt-4o-mini': ModelTier.BASE,
  'x-ai/grok-4': ModelTier.MID,
  'deepseek/deepseek-chat-v3.1': ModelTier.MID,
  'openai/gpt-5': ModelTier.TOP,
  'anthropic/claude-3.7-sonnet': ModelTier.TOP,
  'google/gemini-2.5-pro': ModelTier.TOP,
  'google/gemini-2.5-flash-image-preview': ModelTier.MID,
  'qwen/qwen2.5-vl-32b-instruct': ModelTier.MID,
};

// Стоимость (SP) за запрос по тарифным уровням
export const TIER_PRICES_SP: Record<ModelTier, { withSub: number; withoutSub: number }> = {
  [ModelTier.BASE]: { withSub: 0, withoutSub: 0 },
  [ModelTier.MID]: { withSub: 0.01, withoutSub: 0.013 },
  [ModelTier.TOP]: { withSub: 0.02, withoutSub: 0.03 },
};

// Суточный лимит бесплатных запросов для BASE без подписки
export const DAILY_BASE_FREE_LIMIT = 30;

// Стоимость премиум подписки в SP
export const PREMIUM_SUBSCRIPTION_COST_SP = 10;

// Возвращает цену в SP для конкретной модели с учётом подписки
export function getPriceSP(model: string, hasActiveSub: boolean): number {
  // Приоритет: индивидуальные цены для модели
  const specific = MODEL_PRICES_SP[model as keyof typeof MODEL_PRICES_SP];
  if (specific) {
    return hasActiveSub ? specific.withSub : specific.withoutSub;
  }
  // Fallback: цены по тарифному уровню
  const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
  const prices = TIER_PRICES_SP[tier];
  return hasActiveSub ? prices.withSub : prices.withoutSub;
}

// Модели, поддерживающие input_audio (по OpenRouter сейчас: gemini-2.5-flash)
export const MODELS_SUPPORTING_AUDIO = new Set<string>([
  'google/gemini-2.5-pro',
]);

// Модели, поддерживающие изображение (photos)
export const MODELS_SUPPORTING_PHOTOS = new Set<string>([
  'openai/gpt-5',
  'anthropic/claude-3.7-sonnet',
  'x-ai/grok-4',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash-image-preview',
  'qwen/qwen2.5-vl-32b-instruct',
  'openai/gpt-4o-mini',
]);

// Модели, умеющие генерировать изображения (для иконки 🖼)
export const MODELS_SUPPORTING_IMAGE_GENERATION = new Set<string>([
  'google/gemini-2.5-flash-image-preview',
]);

// Популярные модели (для иконки 🔥)
export const POPULAR_MODELS = new Set<string>([
  'openai/gpt-5',
  'google/gemini-2.5-flash-image-preview',
  'google/gemini-2.5-pro',
  'deepseek/deepseek-chat-v3.1',
]);

// Стикер, отправляемый вместе со статусом обработки
export const PROCESSING_STICKER_FILE_ID = 'CAACAgIAAxkBAAESJRFowC0q2XhJ_hqLbkrUe3v2twRQRgACsIUAAtvAAUqsKv_aWARYsTYE';

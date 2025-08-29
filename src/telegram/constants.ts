export const models = [
    'openai/gpt-5',
    'anthropic/claude-3.7-sonnet',
    'x-ai/grok-4',
    'google/gemini-2.5-pro',
    'deepseek/deepseek-chat-v3.1',
    'google/gemini-2.5-flash',
    'qwen/qwen2.5-vl-32b-instruct',
    'openai/gpt-4o-mini',
];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/csv',
    'text/plain',
]);

// Модели, поддерживающие работу с файлами (валидируем перед отправкой)
export const MODELS_SUPPORTING_FILES = new Set<string>([
    // Уточняйте по мере подключения движков
    'openai/gpt-5',
]);

// Стоимость (SP/запрос) и условная «сила ума» для отображения в меню выбора модели
export const MODEL_INFO: Record<string, { price: number; power: number }> = {
    'openai/gpt-5': { price: 0.01, power: 1000 },
    'anthropic/claude-3.7-sonnet': { price: 0.03, power: 850 },
    'x-ai/grok-4': { price: 0.01, power: 750 },
    'google/gemini-2.5-pro': { price: 0.01, power: 750 },
    'deepseek/deepseek-chat-v3.1': { price: 0.01, power: 850 },
    'google/gemini-2.5-flash': { price: 0.0015, power: 500 },
    'qwen/qwen2.5-vl-32b-instruct': { price: 0.005, power: 500 },
    'openai/gpt-4o-mini': { price: 0, power: 200 },
};

// Мок: наличие премиума у пользователя (глобально для демонстрации)
export const mockIsHavePremium = true;
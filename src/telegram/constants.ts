export const models = [
    'deepseek/deepseek-chat-v3.1',
    'openai/gpt-5',
    'anthropic/claude-3.7-sonnet',
    'google/gemini-2.5-pro',
    'qwen/qwen2.5-vl-32b-instruct',
    'x-ai/grok-4',
    'openai/gpt-4o-mini'
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
export function getModelDisplayName(model: string): string {
  const modelNames: { [key: string]: string } = {
    'openai/gpt-5': 'GPT-5',
    'anthropic/claude-3.7-sonnet': 'Claude 3.7 Sonnet',
    'deepseek/deepseek-chat-v3.1': 'DeepSeek',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash-image-preview': 'Nano 🍌',
    'qwen/qwen2.5-vl-32b-instruct': 'Qwen2.5',
    'x-ai/grok-4': 'Grok 4 (Vision)',
    'openai/gpt-4o-mini': 'GPT-4o — mini',
  };
  return modelNames[model] || model;
}

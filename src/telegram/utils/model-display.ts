export function getModelDisplayName(model: string): string {
    const modelNames: { [key: string]: string } = {
        'deepseek/deepseek-chat-v3.1': 'DeepSeek Chat v3.1',
        'openai/gpt-5': 'GPT-5',
        'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
        'x-ai/grok-4': 'Grok-4',
        'openai/gpt-5-mini': 'GPT-5 Mini',
    };
    return modelNames[model] || model;
}



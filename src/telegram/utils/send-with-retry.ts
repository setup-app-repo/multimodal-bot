import type { Api } from 'grammy';

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type ApiMethodName =
    | 'sendMessage'
    | 'sendPhoto'
    | 'sendSticker'
    | 'deleteMessage'
    | 'editMessageText'
    | 'editMessageReplyMarkup'
    | 'sendChatAction';

/**
 * Универсальная обёртка над Telegram API методами, уважающая 429 retry_after.
 * Пример: await sendWithRetry(api, 'sendMessage', [chatId, text, options], logger)
 */
export async function sendWithRetry<T = any>(
    api: Api,
    method: ApiMethodName,
    args: any[],
    logger?: { warn?: (message: string, context?: string) => void },
    maxAttempts: number = 4,
): Promise<T> {
    let attempt = 1;
    let lastError: any;

    // @ts-ignore
    const fn = (api as any)[method]?.bind(api);
    if (typeof fn !== 'function') {
        throw new Error(`Unknown API method: ${method}`);
    }

    while (attempt <= maxAttempts) {
        try {
            return await fn(...args);
        } catch (error: any) {
            const isRateLimited = error?.name === 'GrammyError' && error?.error_code === 429;
            if (isRateLimited) {
                const retryAfterSec = Number(error?.parameters?.retry_after) || 0;
                const delayMs = retryAfterSec > 0
                    ? retryAfterSec * 1000
                    : Math.min(1000 * Math.pow(2, attempt - 1), 5000);

                logger?.warn?.(
                    `${method} rate-limited (429). Retry in ${Math.round(delayMs / 1000)}s [attempt ${attempt}/${maxAttempts}]`,
                    'TelegramRateLimit',
                );

                await sleep(delayMs);
                attempt += 1;
                lastError = error;
                continue;
            }
            // Иные ошибки — пробрасываем
            throw error;
        }
    }

    throw lastError;
}

export async function sendMessageWithRetry(api: Api, ...args: Parameters<Api['sendMessage']>) {
    return sendWithRetry(api, 'sendMessage', args as any);
}

export async function sendPhotoWithRetry(api: Api, ...args: Parameters<Api['sendPhoto']>) {
    return sendWithRetry(api, 'sendPhoto', args as any);
}

export async function sendStickerWithRetry(api: Api, ...args: Parameters<Api['sendSticker']>) {
    return sendWithRetry(api, 'sendSticker', args as any);
}

export async function deleteMessageWithRetry(api: Api, ...args: Parameters<Api['deleteMessage']>) {
    return sendWithRetry(api, 'deleteMessage', args as any);
}

export async function editMessageTextWithRetry(api: Api, ...args: Parameters<Api['editMessageText']>) {
    return sendWithRetry(api, 'editMessageText', args as any);
}

export async function editMessageReplyMarkupWithRetry(api: Api, ...args: Parameters<Api['editMessageReplyMarkup']>) {
    return sendWithRetry(api, 'editMessageReplyMarkup', args as any);
}

export async function sendChatActionWithRetry(api: Api, ...args: Parameters<Api['sendChatAction']>) {
    return sendWithRetry(api, 'sendChatAction', args as any);
}



import type { Api } from 'grammy';

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Безопасный вызов api.getFile с учётом rate limit 429 и параметра retry_after.
 */
export async function getFileWithRetry(
    api: Api,
    fileId: string,
    logger?: { warn?: (message: string, context?: string) => void },
    maxAttempts: number = 4,
): Promise<any> {
    let attempt = 1;
    let lastError: any;

    while (attempt <= maxAttempts) {
        try {
            return await api.getFile(fileId);
        } catch (error: any) {
            const isRateLimited = error?.name === 'GrammyError' && error?.error_code === 429;
            if (isRateLimited) {
                const retryAfterSec = Number(error?.parameters?.retry_after) || 0;
                const delayMs = retryAfterSec > 0
                    ? retryAfterSec * 1000
                    : Math.min(1000 * Math.pow(2, attempt - 1), 5000);

                logger?.warn?.(
                    `getFile rate-limited (429). Retry in ${Math.round(delayMs / 1000)}s [attempt ${attempt}/${maxAttempts}]`,
                    'TelegramRateLimit',
                );

                await sleep(delayMs);
                attempt += 1;
                lastError = error;
                continue;
            }

            // Не 429 — пробрасываем сразу
            throw error;
        }
    }

    throw lastError;
}



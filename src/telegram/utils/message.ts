// Утилиты для экранирования и отправки длинных сообщений в Telegram
// Экспорт: escapeMarkdown, splitLong, sendLongMessage(ctx, t, message, opts)

import { BotContext } from '../interfaces';
import { sendMessageWithRetry } from './send-with-retry';

/**
 * Экранирует специальные символы Telegram Markdown (v1) в произвольном тексте,
 * чтобы избежать ошибок парсинга сущностей.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()`])/g, '\\$1');
}

/**
 * Удаляет тройные бэктики ``` и одиночные ` из текста ответа модели
 * + убирает жирный markdown **...** и упрощает LaTeX ($...$, $$...$$, \boxed{...})
 */
export function stripCodeFences(text: string): string {
  // Удаляем блоки ```lang ... ``` и просто ``` ... ```
  let out = text.replace(/```[a-zA-Z0-9+-]*\n([\s\S]*?)```/g, '$1');
  out = out.replace(/```([\s\S]*?)```/g, '$1');
  // Удаляем одиночные инлайновые бэктики вокруг фраз
  out = out.replace(/`([^`]+)`/g, '$1');

  // Убираем markdown-жирный **...**
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');

  // Упрощаем/убираем базовый LaTeX
  // Блоки $$...$$ → содержимое
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  // Инлайн $...$ → содержимое (осторожно, уберём долларовые формулы)
  out = out.replace(/\$([^$]+)\$/g, '$1');
  // Специально убираем \\boxed{...} → ...
  out = out.replace(/\\boxed\{([^}]*)\}/g, '$1');
  // Убираем скобочные маркеры \\( \\) \\[ \\]
  out = out.replace(/\\[\[\]\(\)]/g, '');

  return out;
}

/**
 * Экранирует спецсимволы для HTML parse_mode в Telegram
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Убирает базовый Markdown-разметчик (заголовки ###, жирный **, курсив *_ _*)
 */
export function stripBasicMarkdown(text: string): string {
  if (!text) return text;
  let out = text;
  // Заголовки в начале строки (#, ##, ### ...)
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // Жирный и подчёркнутый
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  // Курсив
  out = out.replace(/\*([^*]+)\*/g, '$1');
  out = out.replace(/_([^_]+)_/g, '$1');
  // Инлайн-код
  out = out.replace(/`([^`]+)`/g, '$1');
  return out;
}

export function buildImageFooterByLang(lang: string, link?: string): string {
  const hasLink = !!link;
  const safeLink = hasLink ? String(link).replace(/"/g, '&quot;') : undefined;
  switch (lang) {
    case 'en':
      return hasLink
        ? `✨ Generated via <a href="${safeLink}">Multi‑Chat bot</a>`
        : '✨ Generated via Multi‑Chat bot';
    case 'es':
      return hasLink
        ? `✨ Generado a través de <a href="${safeLink}">bot Multi‑Chat</a>`
        : '✨ Generado a través del bot Multi‑Chat';
    case 'de':
      return hasLink
        ? `✨ Generiert über <a href="${safeLink}">Multi‑Chat‑Bot</a>`
        : '✨ Generiert über den Multi‑Chat‑Bot';
    case 'pt':
      return hasLink
        ? `✨ Gerado via <a href="${safeLink}">bot Multi‑Chat</a>`
        : '✨ Gerado via bot Multi‑Chat';
    case 'fr':
      return hasLink
        ? `✨ Généré via <a href="${safeLink}">bot Multi‑Chat</a>`
        : '✨ Généré via le bot Multi‑Chat';
    case 'vi':
      return hasLink
        ? `✨ Được tạo qua <a href="${safeLink}">bot Multi‑Chat</a>`
        : '✨ Được tạo qua bot Multi‑Chat';
    case 'ru':
    default:
      return hasLink
        ? `✨ Сгенерировано через <a href="${safeLink}">Мульти‑Чат бота</a>`
        : '✨ Сгенерировано через Мульти‑Чат бота';
  }
}

/**
 * Разбивает длинное сообщение на части, чтобы не превысить лимит Telegram (4096 символов)
 */
export function splitLong(text: string, maxLength: number = 4096): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const parts: string[] = [];
  let currentPart = '';

  const splitByLength = (str: string, len: number): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += len) {
      chunks.push(str.slice(i, i + len));
    }
    return chunks;
  };

  // Разбиваем по абзацам (двойные переносы строк)
  const paragraphs = text.split('\n\n');
  for (const paragraph of paragraphs) {
    if ((currentPart + '\n\n' + paragraph).length <= maxLength) {
      if (currentPart) {
        currentPart += '\n\n' + paragraph;
      } else {
        currentPart = paragraph;
      }
    } else {
      if (currentPart) {
        parts.push(currentPart);
      }

      if (paragraph.length > maxLength) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        let sentencePart = '';
        for (const sentence of sentences) {
          if ((sentencePart + ' ' + sentence).length <= maxLength) {
            if (sentencePart) {
              sentencePart += ' ' + sentence;
            } else {
              sentencePart = sentence;
            }
          } else {
            if (sentencePart) {
              parts.push(sentencePart);
            }
            if (sentence.length > maxLength) {
              const chunks = splitByLength(sentence, maxLength);
              parts.push(...chunks.slice(0, -1));
              sentencePart = chunks[chunks.length - 1];
            } else {
              sentencePart = sentence;
            }
          }
        }
        currentPart = sentencePart || '';
      } else {
        currentPart = paragraph;
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts;
}

/**
 * Отправляет сообщение, разбивая его на части при необходимости
 */
export async function sendLongMessage(
  ctx: BotContext,
  t: (key: string, args?: Record<string, any>) => string,
  message: string,
  options?: any,
): Promise<void> {
  const parts = splitLong(message);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partOptions = { ...options };

    if (parts.length > 1) {
      const partIndicator = `\n\n📄 ${t('message_part', { current: i + 1, total: parts.length })}`;
      if (part.length + partIndicator.length <= 4096) {
        await sendMessageWithRetry((ctx as any).api, (ctx as any).chat.id, part + partIndicator, partOptions);
      } else {
        await sendMessageWithRetry((ctx as any).api, (ctx as any).chat.id, part, partOptions);
      }
    } else {
      await sendMessageWithRetry((ctx as any).api, (ctx as any).chat.id, part, partOptions);
    }

    if (i < parts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

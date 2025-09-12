import { InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';

import { safeAnswerCallbackQuery } from './callback.utils';
import { editMessageTextWithRetry } from 'src/telegram/utils';

export const renderScreen = async (
  ctx: BotContext,
  params: {
    text: string;
    keyboard?: InlineKeyboard;
    parse_mode?: 'HTML' | 'Markdown';
  },
) => {
  await safeAnswerCallbackQuery(ctx);
  const { text, keyboard, parse_mode } = params;
  const chatId = (ctx as any)?.chat?.id || (ctx as any)?.callbackQuery?.message?.chat?.id;
  const messageId = (ctx as any)?.callbackQuery?.message?.message_id || (ctx as any)?.msg?.message_id;
  try {
    await editMessageTextWithRetry((ctx as any).api, chatId, messageId, text, { reply_markup: keyboard, parse_mode } as any);
  } catch {
    if (ctx.callbackQuery) {
      try {
        await ctx.deleteMessage();
      } catch { }
    }
    await ctx.reply(text, { reply_markup: keyboard, parse_mode });
  }
};

import { InlineKeyboard } from 'grammy';

import { BotContext } from '../../interfaces';

import { safeAnswerCallbackQuery } from './callback.utils';

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
  try {
    await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode });
  } catch {
    if (ctx.callbackQuery) {
      try {
        await ctx.deleteMessage();
      } catch {}
    }
    await ctx.reply(text, { reply_markup: keyboard, parse_mode });
  }
};

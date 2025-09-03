import { BotContext } from '../../interfaces';

export const safeAnswerCallbackQuery = async (
  ctx: BotContext,
  options?: { text?: string; show_alert?: boolean; url?: string },
) => {
  try {
    if (!ctx.callbackQuery) return;
    await ctx.answerCallbackQuery(options);
  } catch (error: any) {
    if (
      error?.description?.includes('query is too old') ||
      error?.description?.includes('query ID is invalid')
    ) {
      console.warn(
        'Callback query timeout or invalid ID, ignoring:',
        error.description,
      );
      return;
    }
    console.error('Error answering callback query:', error);
  }
};

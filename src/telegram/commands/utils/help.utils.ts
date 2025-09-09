import { BotContext } from '../../interfaces';

import { TranslateFn } from './types';

export const buildHelpText = (ctx: BotContext, t: TranslateFn) => {
  return (
    `${t(ctx, 'help_usage')}\n\n` +
    `${t(ctx, 'help_commands_title')}\n` +
    `${t(ctx, 'help_start')}\n` +
    `${t(ctx, 'help_help')}\n` +
    `${t(ctx, 'help_model')}\n` +
    `${t(ctx, 'help_profile')}\n` +
    `${t(ctx, 'help_language')}\n` +
    `${t(ctx, 'help_clear')}\n\n` +
    `${t(ctx, 'help_files')}\n` +
    `${t(ctx, 'help_photos')}\n\n` +
    `${t(ctx, 'help_content_rules')}`
  );
};

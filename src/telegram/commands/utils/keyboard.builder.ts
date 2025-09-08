import { InlineKeyboard, Keyboard } from 'grammy';

import { BotContext } from '../../interfaces';

import { TranslateFn } from './types';

export class KeyboardBuilder {
  static buildMainReplyKeyboard(ctx: BotContext, t: TranslateFn) {
    return new Keyboard()
      .text(t(ctx, 'model_selection_button'))
      .row()
      .text(t(ctx, 'profile_button'))
      .text(t(ctx, 'help_button'))
      .resized();
  }

  static buildLanguageInlineKeyboard(ctx: BotContext, t: TranslateFn) {
    return new InlineKeyboard()
      .text(t(ctx, 'language_english'), 'lang_en')
      .row()
      .text(t(ctx, 'language_russian'), 'lang_ru')
      .row()
      .text(t(ctx, 'language_spanish'), 'lang_es')
      .row()
      .text(t(ctx, 'language_german'), 'lang_de')
      .row()
      .text(t(ctx, 'language_portuguese'), 'lang_pt')
      .row()
      .text(t(ctx, 'language_french'), 'lang_fr')
      .row()
      .text(t(ctx, 'language_vietnamese'), 'lang_vi');
  }
}

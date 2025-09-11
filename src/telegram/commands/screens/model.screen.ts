import { InlineKeyboard } from 'grammy';

import {
  DEFAULT_MODEL,
  MODELS_SUPPORTING_FILES,
  MODELS_SUPPORTING_PHOTOS,
  MODELS_SUPPORTING_AUDIO,
  MODELS_SUPPORTING_IMAGE_GENERATION,
  POPULAR_MODELS,
  getPriceSP,
  models,
  MODEL_INFO,
} from '../../constants';
import { BotContext } from '../../interfaces';
import { getModelDisplayName } from '../../utils/model-display';
import { RegisterCommandsDeps, ScreenData } from '../utils/types';

export class ModelScreen {
  constructor(private deps: RegisterCommandsDeps) { }

  async buildConnected(ctx: BotContext, modelFromParams?: string): Promise<ScreenData> {
    const { t, subscriptionService, redisService } = this.deps;
    const userId = String(ctx.from?.id);
    const selectedModel =
      modelFromParams || (await redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;
    const modelDisplayName = getModelDisplayName(selectedModel);
    const isPremium = await subscriptionService.hasActiveSubscription(userId);
    const priceWithoutSub = getPriceSP(selectedModel, false);
    const priceWithSub = getPriceSP(selectedModel, true);

    const header = t(ctx, 'model_connected_title', { model: modelDisplayName });
    const MODEL_TO_ABOUT_KEY: Record<string, string> = {
      'openai/gpt-5': 'model_about_gpt5',
      'google/gemini-2.5-flash-image-preview': 'model_about_nano',
      'anthropic/claude-3.7-sonnet': 'model_about_claude37_sonnet',
      'x-ai/grok-4': 'model_about_grok4',
      'google/gemini-2.5-pro': 'model_about_gemini25_pro',
      'deepseek/deepseek-chat-v3.1': 'model_about_deepseek',
      'qwen/qwen2.5-vl-32b-instruct': 'model_about_qwen25',
      'openai/gpt-4o-mini': 'model_about_gpt4o_mini',
    };
    const aboutKey = MODEL_TO_ABOUT_KEY[selectedModel];
    const aboutBlock = aboutKey
      ? [t(ctx, 'model_about_title'), t(ctx, aboutKey)].join('\n')
      : '';
    const capabilitiesTitle = t(ctx, 'model_capabilities_title') || `✨ <b>Возможности модели:</b>`;

    const capabilityLines: string[] = [];
    capabilityLines.push(`📝 <code>${t(ctx, 'capability_text') || 'Текст'}</code>`);
    if (MODELS_SUPPORTING_PHOTOS.has(selectedModel)) {
      capabilityLines.push(`📷 <code>${t(ctx, 'capability_photos') || 'Фотографии'}</code>`);
    }
    if (MODELS_SUPPORTING_FILES.has(selectedModel)) {
      capabilityLines.push(`📎 <code>${t(ctx, 'capability_files') || 'Файлы'}</code>`);
    }
    if (MODELS_SUPPORTING_AUDIO.has(selectedModel)) {
      capabilityLines.push(
        `🎙 <code>${t(ctx, 'capability_voice') || 'Голосовые сообщения'}</code>`,
      );
    }

    const isFree = priceWithoutSub === 0 && priceWithSub === 0;
    const priceBlockLines: string[] = [];
    if (isFree) {
      priceBlockLines.push(t(ctx, 'model_price_line_free'));
    } else {
      priceBlockLines.push(
        t(ctx, 'model_price_base_line', { price_without: priceWithoutSub.toFixed(2) }),
      );
      priceBlockLines.push(
        t(ctx, 'model_price_with_premium_line', { price_with: priceWithSub.toFixed(2) }),
      );
      priceBlockLines.push(t(ctx, 'model_premium_applies_all'));
    }

    const attachmentsNote = t(ctx, 'attachments_double_cost_note');
    const footer = t(ctx, 'chat_start_hint');

    const textParts: string[] = [header];
    if (aboutBlock) {
      textParts.push('');
      textParts.push(aboutBlock);
    }
    textParts.push('');
    textParts.push(capabilitiesTitle);
    textParts.push(capabilityLines.join('\n'));
    textParts.push('');
    textParts.push(priceBlockLines.join('\n'));
    textParts.push('');
    textParts.push(attachmentsNote);
    textParts.push('');
    textParts.push(footer);

    const text = textParts.join('\n');

    const keyboard = new InlineKeyboard();
    if (!isPremium) {
      keyboard.text(t(ctx, 'model_buy_premium_button'), 'profile:premium').row();
    }
    keyboard.text(t(ctx, 'model_back_button'), 'model:back');

    return { text, keyboard, parse_mode: 'HTML' };
  }

  async buildSelectionKeyboard(
    ctx: BotContext,
  ): Promise<ScreenData> {
    const { t, subscriptionService, redisService } = this.deps;
    const userId = String(ctx.from?.id);
    const selectedModel = (await redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;
    const keyboard = new InlineKeyboard();
    const hasActive = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
    models.forEach((model) => {
      const { power } = MODEL_INFO[model] || { price: 0, power: 0 };
      const price = getPriceSP(model, hasActive);
      const displayName = getModelDisplayName(model);
      const prefix = selectedModel === model ? '✅ ' : '';
      const priceLabel = price === 0 ? t(ctx, 'price_free_short') : `${price.toFixed(2)} SP`;
      const canGenerateImage = MODELS_SUPPORTING_IMAGE_GENERATION.has(model);
      const isPopular = POPULAR_MODELS.has(model);
      const labelCore = `${displayName} • ${priceLabel} • 🧠 ${power}`;
      let iconSuffix = '';
      if (canGenerateImage) iconSuffix += ' • 🖼';
      if (isPopular) iconSuffix += ' • 🔥';
      const label = `${prefix}${labelCore}${iconSuffix}`;
      keyboard.text(label, `model_${model}`).row();
    });
    keyboard.text(t(ctx, 'model_close_button'), 'model:close');
    const intro = t(ctx, 'select_model_intro');
    const legend = t(ctx, 'select_model_legend');
    const text = [intro, '', legend].join('\n');
    return { text, keyboard, parse_mode: 'HTML' };
  }
}

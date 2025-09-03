import { BotContext } from '../../interfaces';
import { TranslateFn } from './types';

export const getLanguageLabel = (ctx: BotContext, t: TranslateFn, code: string): string => {
    const key =
        code === 'en' ? 'language_english' :
        code === 'ru' ? 'language_russian' :
        code === 'es' ? 'language_spanish' :
        code === 'de' ? 'language_german' :
        code === 'pt' ? 'language_portuguese' :
        'language_french';
    return t(ctx, key);
};

export const getLanguageNameWithoutFlag = (ctx: BotContext, t: TranslateFn, code: string): string => {
    const fullLabel = getLanguageLabel(ctx, t, code);
    return fullLabel.replace(/^(?:\uD83C[\uDDE6-\uDDFF]){2}\s*/, '').trim();
};

export const getLocaleCode = (ctx: BotContext): string => (
    ctx.session.lang === 'ru' ? 'ru-RU'
        : ctx.session.lang === 'es' ? 'es-ES'
        : ctx.session.lang === 'de' ? 'de-DE'
        : ctx.session.lang === 'pt' ? 'pt-PT'
        : ctx.session.lang === 'fr' ? 'fr-FR'
        : 'en-US'
);



import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { models, MODEL_INFO } from '../constants';
import { AppType } from '@setup-app-repo/setup.app-sdk';
import { UserService } from 'src/user/user.service';
import { getModelDisplayName } from '../utils/model-display';
import { SubscriptionService } from 'src/subscription/subscription.service';

type TranslateFn = (ctx: BotContext, key: string, args?: Record<string, any>) => string;

export interface RegisterCommandsDeps {
    t: TranslateFn;
    i18n: I18nService;
    redisService: RedisService;
    setupAppService: SetupAppService;
    userService: UserService;
    subscriptionService: SubscriptionService;
}

export function registerCommands(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
    const { t, i18n, redisService, setupAppService, userService, subscriptionService } = deps;


    // Безопасный ответ на callback query с обработкой ошибок
    const safeAnswerCallbackQuery = async (ctx: BotContext, options?: { text?: string; show_alert?: boolean }) => {
        try {
            await ctx.answerCallbackQuery(options);
        } catch (error: any) {
            // Игнорируем ошибки timeout и invalid query ID, так как они не критичны
            if (error?.description?.includes('query is too old') || 
                error?.description?.includes('query ID is invalid')) {
                console.warn('Callback query timeout or invalid ID, ignoring:', error.description);
                return;
            }
            // Для других ошибок логируем, но не прерываем выполнение
            console.error('Error answering callback query:', error);
        }
    };

    const getLocaleCode = (ctx: BotContext): string => (
        ctx.session.lang === 'ru' ? 'ru-RU'
            : ctx.session.lang === 'es' ? 'es-ES'
            : ctx.session.lang === 'de' ? 'de-DE'
            : ctx.session.lang === 'pt' ? 'pt-PT'
            : ctx.session.lang === 'fr' ? 'fr-FR'
            : 'en-US'
    );

    const ensurePremiumDefaults = (ctx: BotContext) => {
        if (!ctx.session.premiumExpiresAt) {
            const addDays = 30;
            const expires = new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);
            ctx.session.premiumExpiresAt = expires.toISOString();
        }
        if (typeof ctx.session.premiumAutorenew === 'undefined') {
            ctx.session.premiumAutorenew = false;
        }
    };

    const buildPremiumActiveTextAndKeyboard = async (ctx: BotContext) => {
        ensurePremiumDefaults(ctx);
        const expiresAtDate = new Date(ctx.session.premiumExpiresAt as string);
        const msLeft = expiresAtDate.getTime() - Date.now();
        const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const locale = getLocaleCode(ctx);
        const expiresAt = expiresAtDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/[\u2068\u2069]/g, '');
        const autorenewLabel = ctx.session.premiumAutorenew ? t(ctx, 'switch_on') : t(ctx, 'switch_off');

        const header = t(ctx, 'premium_active_title');
        let balance = 0;
        try { balance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
        const body = t(ctx, 'premium_active_text', {
            expires_at: expiresAt,
            days_left: String(daysLeft),
            autorenew: autorenewLabel,
            balance: String(balance),
        });

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'premium_extend_30_button'), 'premium:extend')
            .row()
            .text(
                ctx.session.premiumAutorenew 
                    ? t(ctx, 'premium_autorenew_toggle_button_on', { on: t(ctx, 'switch_on') })
                    : t(ctx, 'premium_autorenew_toggle_button_off', { off: t(ctx, 'switch_off') }),
                'premium:toggle_autorenew'
            )
            .row()
            .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
            .row()
            .text(t(ctx, 'premium_back_button'), 'profile:back');

        const text = `${header}\n${body}`;
        return { text, keyboard };
    };

    const getPlanLimits = (ctx: BotContext, plan: string) => {
        if (plan.toLowerCase() === 'start') {
            return t(ctx, 'plan_start_limits');
        }
        return t(ctx, 'plan_custom_limits');
    };

    const replyHelp = async (ctx: BotContext) => {
        const keyboard = new InlineKeyboard()
            .url(t(ctx, 'help_support_button'), 'https://t.me/setupmultisupport_bot');
        await ctx.reply(buildHelpText(ctx), { reply_markup: keyboard });
    };

    const replyProfile = async (ctx: BotContext) => {
        const userId = String(ctx.from?.id);
        const [model] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
        ]);

        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

        let spBalance = 0;
        try { spBalance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
        const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
        const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

        const text =
            `💰 ${t(ctx, 'profile_balance', { balance: spBalance })}
` +
            `⭐ ${t(ctx, 'profile_premium', { status: premiumLabel })}
` +
            `${t(ctx, 'current_model', { model: modelDisplay })}
` +
            `${t(ctx, 'current_language', { lang: getLanguageLabel(ctx, currentLang) })}`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_premium_button'), 'profile:premium')
            .row()
            .text(t(ctx, 'profile_clear_button'), 'profile_clear');

        await ctx.reply(text, { reply_markup: keyboard });
    };

    const replyModelSelection = async (ctx: BotContext) => {
        const userId = String(ctx.from?.id);
        const selectedModel = await redisService.get<string>(`chat:${userId}:model`);
        const keyboard = new InlineKeyboard();
        models.forEach((model) => {
            const { price, power } = MODEL_INFO[model] || { price: 0, power: 0 };
            const displayName = getModelDisplayName(model);
            const prefix = selectedModel === model ? '✅ ' : '';
            const label = `${prefix}${displayName} • ${price} SP • 🧠 ${power}`;
            keyboard.text(label, `model_${model}`).row();
        });
        keyboard.text(t(ctx, 'model_close_button'), 'model:close');
        await ctx.reply(t(ctx, 'select_model_title'), { reply_markup: keyboard });
    };

    // Обработка нажатий reply-клавиатуры
    bot.on('message:text', async (ctx, next) => {
        const text = ctx.message.text;
        const action = detectReplyAction(text);

        if (action === 'help') {
            await replyHelp(ctx);
            return; // не передаём дальше
        }
        if (action === 'profile') {
            await replyProfile(ctx);
            return;
        }
        if (action === 'model') {
            await replyModelSelection(ctx);
            return;
        }
        return next();
    });

    const getLanguageLabel = (ctx: BotContext, code: string): string => {
        const key =
            code === 'en' ? 'language_english' :
            code === 'ru' ? 'language_russian' :
            code === 'es' ? 'language_spanish' :
            code === 'de' ? 'language_german' :
            code === 'pt' ? 'language_portuguese' :
            'language_french';
        return t(ctx, key);
    };

    const buildHelpText = (ctx: BotContext) => {
        return (
            `${t(ctx, 'help_title')}\n\n` +
            `${t(ctx, 'help_usage')}\n\n` +
            `${t(ctx, 'help_commands_title')}\n` +
            `${t(ctx, 'help_start')}\n` +
            `${t(ctx, 'help_help')}\n` +
            `${t(ctx, 'help_model')}\n` +
            `${t(ctx, 'help_profile')}\n` +
            `${t(ctx, 'help_language')}\n` +
            `${t(ctx, 'help_clear')}\n` +
            `${t(ctx, 'help_billing')}\n\n` +
            `${t(ctx, 'help_context_rules_title')}\n` +
            `${t(ctx, 'help_context_rules_1')}\n` +
            `${t(ctx, 'help_context_rules_2')}\n` +
            `${t(ctx, 'help_context_rules_3')}\n\n` +
            `${t(ctx, 'help_files')}\n\n` +
            `${t(ctx, 'help_content_rules')}\n` +
            `${t(ctx, 'help_disclaimer')}`
        );
    };

    const buildMainReplyKeyboard = (ctx: BotContext) => {
        return new Keyboard()
            .text(t(ctx, 'help_button'))
            .text(t(ctx, 'profile_button'))
            .row()
            .text(t(ctx, 'model_selection_button'))
            .resized();
    };

    const getAllLocaleLabels = (key: string): string[] => {
        return i18n.getSupportedLocales().map((loc) => i18n.t(key, loc));
    };

    const detectReplyAction = (text: string): 'help' | 'profile' | 'model' | null => {
        if (getAllLocaleLabels('help_button').includes(text)) return 'help';
        if (getAllLocaleLabels('profile_button').includes(text)) return 'profile';
        if (getAllLocaleLabels('model_selection_button').includes(text)) return 'model';
        return null;
    };
    
    const processUserAuth = async (telegramId: number, ctx: BotContext): Promise<{ success: boolean; isNewUser: boolean }> => {
        try {
            if (!setupAppService.isInitialized()) {
                console.warn(` ⚠️ Setup.app service not initialized, skipping user auth for ${telegramId}`);
                return { success: false, isNewUser: false };
            }
            const isNewUser = await setupAppService.auth(telegramId, {
                firstName: ctx.from?.first_name || '',
                lastName: ctx.from?.last_name || '',
                username: ctx.from?.username || '',
            });
            return { success: true, isNewUser };
        } catch (error) {
            console.error(` ❌ Error during Setup.app authentication for user ${telegramId}:`, error);
            return { success: false, isNewUser: false };
        }
    };

    const processMenuButtonAsync = async (ctx: BotContext, telegramId: number) => {
        try {
            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            await setupAppService.setupMenuButton(ctx as any, { language: currentLang, appType: AppType.DEFAULT});
        } catch (e) {}
    };

    bot.command('start', async (ctx) => {
        if (ctx.from?.id) {
            try {
                const telegramId = ctx.from?.id as number;
                await this.setupAppService.auth(telegramId, {
                    firstName: ctx.from?.first_name || '',
                    lastName: ctx.from?.last_name || '',
                    username: ctx.from?.username || '',
                  });
            
                await userService.findOrCreateUser(String(telegramId), {
                    telegramId: String(telegramId),
                    username: ctx.from.username,
                    firstName: ctx.from.first_name || 'User',
                    lastName: ctx.from.last_name,
                    languageCode: ctx.from.language_code,
                    isPremium: ctx.from.is_premium || false,
                });
                console.debug(`User ensured in DB: ${telegramId}`);
            } catch (e) {
                console.error('Error ensuring user in DB on /start:', e);
            }
        }
        const userId = String(ctx.from?.id);

        const [model, plan, savedLang] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
            redisService.get<string>(`chat:${userId}:plan`),
            redisService.get<string>(`chat:${userId}:lang`),
        ]);

        // Если язык ещё не сохранён — сначала показываем выбор языка и выходим
        if (!savedLang) {
            const profileLangCode = ctx.from?.language_code;
            const initialLang = profileLangCode && i18n.isLocaleSupported(profileLangCode) ? profileLangCode : 'ru';
            ctx.session.lang = initialLang;
            // Сначала отправляем приветствие перед выбором языка
            await ctx.reply(t(ctx, 'start_language_welcome'));

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'language_english'), 'lang_en').row()
                .text(t(ctx, 'language_russian'), 'lang_ru').row()
                .text(t(ctx, 'language_spanish'), 'lang_es').row()
                .text(t(ctx, 'language_german'), 'lang_de').row()
                .text(t(ctx, 'language_portuguese'), 'lang_pt').row()
                .text(t(ctx, 'language_french'), 'lang_fr');
            await ctx.reply(t(ctx, 'choose_language'), { reply_markup: keyboard });
            return;
        }

        // Язык есть — гарантируем его в сессии
        ctx.session.lang = ctx.session.lang || savedLang;

        const promoTextStart = t(ctx, 'onboarding_promo', { first_name: ctx.from?.first_name || ctx.from?.username || '' }).replace(/\\n/g, '\n');

        const telegramId = ctx.from?.id as number;

        const referralCode = ctx?.match && typeof ctx.match === 'string' ? ctx.match : undefined;

        const authResult = await processUserAuth(telegramId, ctx);
        const promises: Promise<any>[] = [];
        if (referralCode && authResult.success) {
            // заглушка: если появится реализация processReferralAsync, сюда вставим
        }
        promises.push(processMenuButtonAsync(ctx, telegramId));
        await Promise.all(promises);

        await ctx.reply(promoTextStart, { reply_markup: buildMainReplyKeyboard(ctx) });
    });

    bot.command('help', async (ctx) => {
        await replyHelp(ctx);
    });

    bot.command('profile', async (ctx) => {
        const userId = String(ctx.from?.id);
        const [model] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
        ]);

        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

        const spBalance = 0;
        const isPremium = false;
        const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

        const text =
            `👤 ${t(ctx, 'profile_title')}
` +
            `💰 ${t(ctx, 'profile_balance', { balance: spBalance })}
` +
            `⭐ ${t(ctx, 'profile_premium', { status: premiumLabel })}
` +
            `${t(ctx, 'current_model', { model: modelDisplay })}
` +
            `${t(ctx, 'current_language', { lang: getLanguageLabel(ctx, currentLang) })}`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_premium_button'), 'profile:premium')
            .row()
            .text(t(ctx, 'profile_clear_button'), 'profile_clear');

        await ctx.reply(text, { reply_markup: keyboard });
    });

    bot.command('language', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'language_english'), 'lang_en').row()
            .text(t(ctx, 'language_russian'), 'lang_ru').row()
            .text(t(ctx, 'language_spanish'), 'lang_es').row()
            .text(t(ctx, 'language_german'), 'lang_de').row()
            .text(t(ctx, 'language_portuguese'), 'lang_pt').row()
            .text(t(ctx, 'language_french'), 'lang_fr');
        await ctx.reply(t(ctx, 'choose_language'), { reply_markup: keyboard });
    });

    bot.command('billing', async (ctx) => {
        await ctx.reply(t(ctx, 'billing_coming_soon'));
    });

    bot.command('clear', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'yes'), 'clear:confirm')
            .row()
            .text(t(ctx, 'cancel_button'), 'profile:back');
        await ctx.reply(t(ctx, 'clear_confirm'), { reply_markup: keyboard });
    });

    bot.command('model', async (ctx) => {
        await replyModelSelection(ctx);
    });

    bot.on('callback_query:data', async (ctx) => {
        const data = ctx.callbackQuery.data;

        if (data.startsWith('model_')) {
            const selectedModel = data.replace('model_', '');
            if (!models.includes(selectedModel)) {
                await safeAnswerCallbackQuery(ctx, { text: t(ctx, 'invalid_model'), show_alert: true });
                return;
            }
            await redisService.set(`chat:${String(ctx.from?.id)}:model`, selectedModel, 60 * 60);
            await safeAnswerCallbackQuery(ctx);
            const modelDisplayName = getModelDisplayName(selectedModel);
            const { price } = MODEL_INFO[selectedModel] || { price: 0 };
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'model_buy_premium_button'), 'premium:buy')
                .row()
                .text(t(ctx, 'model_close_button'), 'model:close');
            await ctx.reply(
                t(ctx, 'model_active', { model: modelDisplayName, price }),
                { reply_markup: keyboard }
            );
            return;
        }

        if (data === 'model:close') {
            await safeAnswerCallbackQuery(ctx);
            try { await ctx.deleteMessage(); } catch {}
            return;
        }

        if (data === 'menu_help') {
            await safeAnswerCallbackQuery(ctx);
            await replyHelp(ctx);
            return;
        }
        if (data === 'menu_profile') {
            await safeAnswerCallbackQuery(ctx);
            const userId = String(ctx.from?.id);
            const [model] = await Promise.all([
                redisService.get<string>(`chat:${userId}:model`),
            ]);

            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

            let spBalance = 0;
            try { spBalance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
            const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
            const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

            const text =
                `👤 ${t(ctx, 'profile_title')}
` +
                `💰 ${t(ctx, 'profile_balance', { balance: spBalance })}
` +
                `⭐ ${t(ctx, 'profile_premium', { status: premiumLabel })}
` +
                `${t(ctx, 'current_model', { model: modelDisplay })}
` +
                `${t(ctx, 'current_language', { lang: getLanguageLabel(ctx, currentLang) })}`;

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'profile_language_button'), 'profile_language')
                .text(t(ctx, 'profile_premium_button'), 'profile:premium')
                .row()
                .text(t(ctx, 'profile_clear_button'), 'profile_clear');

            await ctx.reply(text, { reply_markup: keyboard });
            return;
        }
        if (data === 'menu_model') {
            await safeAnswerCallbackQuery(ctx);
            await replyModelSelection(ctx);
            return;
        }

        if (data === 'profile:premium') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = ctx.from?.id as number;
            const hasActive = await subscriptionService.hasActiveSubscription(String(telegramId));
            if (hasActive) {
                const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
                await ctx.reply(text, { reply_markup: keyboard });
            } else {
                const premiumText = 
                    `${t(ctx, 'premium_title')}\n\n` +
                    `${t(ctx, 'premium_benefits_title')}\n` +
                    `${t(ctx, 'premium_benefit_1')}\n` +
                    `${t(ctx, 'premium_benefit_2')}\n` +
                    `${t(ctx, 'premium_benefit_3')}`;

                const keyboard = new InlineKeyboard()
                    .text(t(ctx, 'premium_activate_button'), 'premium:activate')
                    .row()
                    .text(t(ctx, 'premium_back_button'), 'premium:back');

                await ctx.reply(premiumText, { reply_markup: keyboard });
            }
            return;
        }

        if (data === 'profile_clear') {
            await safeAnswerCallbackQuery(ctx);
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'yes'), 'clear:confirm')
                .row()
                .text(t(ctx, 'cancel_button'), 'profile:back');
            await ctx.reply(t(ctx, 'clear_confirm'), { reply_markup: keyboard });
            return;
        }

        if (data === 'clear:confirm') {
            await safeAnswerCallbackQuery(ctx);
            const userId = String(ctx.from?.id);
            await redisService.clearHistory(userId);
            await ctx.reply(t(ctx, 'context_cleared'));
            return;
        }

        if (data === 'profile:back') {
            await safeAnswerCallbackQuery(ctx);
            await replyProfile(ctx);
            return;
        }

        if (data.startsWith('lang_')) {
            const selected = data.replace('lang_', '');
            const userId = String(ctx.from?.id);

            // Определяем, первый ли это выбор языка
            const prevLang = await redisService.get<string>(`chat:${userId}:lang`);

            // Применяем новый язык
            ctx.session.lang = selected;
            await redisService.set(`chat:${userId}:lang`, selected);
            await safeAnswerCallbackQuery(ctx);

            const languageKey = `language_${
                selected === 'en' ? 'english' :
                selected === 'ru' ? 'russian' :
                selected === 'es' ? 'spanish' :
                selected === 'de' ? 'german' :
                selected === 'pt' ? 'portuguese' :
                'french'
            }`;

            // После смены языка — переустанавливаем кнопку меню
            await setupAppService.setupMenuButton(ctx as any, { language: selected });

            if (!prevLang) {
                // Первый выбор языка: показываем онбординг и сразу постоянную reply-клавиатуру
                const promoText = t(ctx, 'onboarding_promo', { first_name: ctx.from?.first_name || ctx.from?.username || '' }).replace(/\\n/g, '\n');
                await ctx.reply(promoText, { reply_markup: buildMainReplyKeyboard(ctx) });
            } else if (prevLang !== selected) {
                // Смена языка: короткое сообщение и обновление reply-клавиатуры
                await ctx.reply(
                    t(ctx, 'language_switched', { language: t(ctx, languageKey) }),
                    { reply_markup: buildMainReplyKeyboard(ctx) }
                );
            }
        }

        if (data === 'profile_language') {
            await safeAnswerCallbackQuery(ctx);
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'language_english'), 'lang_en').row()
                .text(t(ctx, 'language_russian'), 'lang_ru').row()
                .text(t(ctx, 'language_spanish'), 'lang_es').row()
                .text(t(ctx, 'language_german'), 'lang_de').row()
                .text(t(ctx, 'language_portuguese'), 'lang_pt').row()
                .text(t(ctx, 'language_french'), 'lang_fr');
            await ctx.reply(t(ctx, 'choose_language'), { reply_markup: keyboard });
            return;
        }

        if (data === 'profile_change_plan') {
            await safeAnswerCallbackQuery(ctx);
            await ctx.reply(t(ctx, 'change_plan_coming_soon'));
            return;
        }

        if (data === 'premium:activate') {
            await safeAnswerCallbackQuery(ctx);
            const cost = 10;
            const telegramId = ctx.from?.id;

            if (!telegramId) {
                await ctx.reply(t(ctx, 'unexpected_error'));
                return;
            }

            try {
                const hasEnough = await setupAppService.have(telegramId, cost);
                if (!hasEnough) {
                    const currentBalance = await setupAppService.getBalance(telegramId);
                    const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'billing:topup');
                    await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard });
                    return;
                }

                await subscriptionService.chargeAndCreateSubscription(
                    telegramId,
                    cost,
                    'Подписка "Premium" 10 SP на Multimodal bot',
                    { periodDays: 30, autoRenew: false }
                );

                const keyboard = new InlineKeyboard()
                    .text(t(ctx, 'premium_enable_autorenew_button'), 'premium:enable_autorenew')
                    .row()
                    .text(t(ctx, 'premium_later_button'), 'profile:back');
                await ctx.reply(t(ctx, 'premium_activated_success'), { reply_markup: keyboard });
            } catch (error: any) {
                // Разделяем ошибки недостатка средств и ошибки БД/прочие
                const message = String(error?.message || '');
                if (message.includes('INSUFFICIENT_FUNDS') || message.includes('not enough') || message.includes('Недостаточно')) {
                    const currentBalance = await setupAppService.getBalance(telegramId);
                    const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'billing:topup');
                    await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard });
                } else if (message.includes('USER_NOT_FOUND')) {
                    await ctx.reply(t(ctx, 'unexpected_error'));
                } else {
                    console.error('premium:activate failed', error);
                    await ctx.reply(t(ctx, 'unexpected_error'));
                }
            }
            return;
        }

        if (data === 'premium:buy') {
            await safeAnswerCallbackQuery(ctx);
            const cost = 10;
            const hasEnough = await setupAppService.have(ctx.from?.id as number, cost);
            if (!hasEnough) {
                const currentBalance = await setupAppService.getBalance(ctx.from?.id as number);
                const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'billing:topup');
                await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard });
                return;
            }
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'premium_enable_autorenew_button'), 'premium:enable_autorenew')
                .row()
                .text(t(ctx, 'premium_later_button'), 'profile:back');
            await ctx.reply(t(ctx, 'premium_activated_success'), { reply_markup: keyboard });
            return;
        }

        if (data === 'premium:back') {
            await safeAnswerCallbackQuery(ctx);
            // Возвращаемся в профиль
            const userId = String(ctx.from?.id);
            const [model] = await Promise.all([
                redisService.get<string>(`chat:${userId}:model`),
            ]);

            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

            const spBalance = 0;
            const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
            const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

            const text =
                `👤 ${t(ctx, 'profile_title')}
` +
                `💰 ${t(ctx, 'profile_balance', { balance: spBalance })}
` +
                `⭐ ${t(ctx, 'profile_premium', { status: premiumLabel })}
` +
                `${t(ctx, 'current_model', { model: modelDisplay })}
` +
                `${t(ctx, 'current_language', { lang: getLanguageLabel(ctx, currentLang) })}`;

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'profile_language_button'), 'profile_language')
                .text(t(ctx, 'profile_premium_button'), 'profile:premium')
                .row()
                .text(t(ctx, 'profile_clear_button'), 'profile_clear');

            await ctx.reply(text, { reply_markup: keyboard });
            return;
        }

        if (data === 'premium:enable_autorenew') {
            await safeAnswerCallbackQuery(ctx);
            const addDays = 30;
            const expires = new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);
            const locale = getLocaleCode(ctx);
            const expiresAt = expires.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/[\u2068\u2069]/g, '');
            try {
                await ctx.editMessageText(t(ctx, 'premium_autorenew_enabled', { expires_at: expiresAt }));
            } catch {
                await ctx.reply(t(ctx, 'premium_autorenew_enabled', { expires_at: expiresAt }));
            }
            return;
        }

        if (data === 'premium:toggle_autorenew') {
            await safeAnswerCallbackQuery(ctx);
            ctx.session.premiumAutorenew = !ctx.session.premiumAutorenew;
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard }); } catch { await ctx.reply(text, { reply_markup: keyboard }); }
            return;
        }

        if (data === 'premium:extend') {
            await safeAnswerCallbackQuery(ctx);
            const cost = 10;
            const telegramId = ctx.from?.id as number;
            const hasEnough = await setupAppService.have(telegramId, cost);
            if (!hasEnough) {
                const currentBalance = await setupAppService.getBalance(telegramId);
                const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'wallet:topup');
                await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard });
                return;
            }
            ensurePremiumDefaults(ctx);
            const current = new Date(ctx.session.premiumExpiresAt as string);
            const extended = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000);
            ctx.session.premiumExpiresAt = extended.toISOString();
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard }); } catch { await ctx.reply(text, { reply_markup: keyboard }); }
            return;
        }

        if (data === 'wallet:topup') {
            await safeAnswerCallbackQuery(ctx);
            await ctx.reply(t(ctx, 'billing_coming_soon'));
            return;
        }

        if (data === 'billing:topup') {
            await safeAnswerCallbackQuery(ctx);
            await ctx.reply(t(ctx, 'billing_coming_soon'));
            return;
        }
    });
}



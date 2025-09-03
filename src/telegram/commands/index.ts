import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { models, MODEL_INFO, DEFAULT_MODEL, getPriceSP, MODELS_SUPPORTING_FILES, MODELS_SUPPORTING_PHOTOS, MODELS_SUPPORTING_AUDIO, PREMIUM_SUBSCRIPTION_COST_SP } from '../constants';
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


    // Глобальный middleware: при любом входящем сообщении обновляем только lastMessageAt
    bot.use(async (ctx, next) => {
        try {
            if (ctx.message && ctx.from?.id) {
                await userService.updateUser(String(ctx.from.id));
            }
        } catch {}
        return next();
    });

    // Безопасный ответ на callback query с обработкой ошибок
    const safeAnswerCallbackQuery = async (ctx: BotContext, options?: { text?: string; show_alert?: boolean; url?: string }) => {
        try {
            // Если обновление не из callback_query, отвечать нечему — выходим
            if (!ctx.callbackQuery) return;
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

    // Единый helper: при callback сначала пытаемся отредактировать текущее сообщение.
    // Если не получилось (например, сообщение слишком старое/не наше) — удаляем его и отправляем новое,
    // чтобы на экране оставалось только одно актуальное сообщение.
    const renderScreen = async (
        ctx: BotContext,
        params: { text: string; keyboard?: InlineKeyboard; parse_mode?: 'HTML' | 'Markdown' }
    ) => {
        await safeAnswerCallbackQuery(ctx);
        const { text, keyboard, parse_mode } = params;
        try {
            await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode });
        } catch {
            // Удаляем исходное сообщение только если это был callback-контекст.
            // Для обычных текстовых сообщений ничего не удаляем, просто отвечаем новым.
            if (ctx.callbackQuery) {
                try { await ctx.deleteMessage(); } catch {}
            }
            await ctx.reply(text, { reply_markup: keyboard, parse_mode });
        }
    };

    type RouteId = 'profile' | 'profile_language' | 'profile_clear' | 'premium' | 'model_connected';
    type RouteParams = Record<string, any> | undefined;

    const buildRouteScreen = async (
        ctx: BotContext,
        route: RouteId,
        params?: RouteParams,
    ): Promise<{ text: string; keyboard?: InlineKeyboard; parse_mode?: 'HTML' | 'Markdown' }> => {
        if (route === 'profile') {
            const userId = String(ctx.from?.id);
            let [model] = await Promise.all([
                redisService.get<string>(`chat:${userId}:model`),
            ]);
            if (!model) model = DEFAULT_MODEL;

            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

            let spBalance = 0;
            try { spBalance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
            const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
            const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

            const balanceLine = t(ctx, 'profile_balance', { balance: spBalance }).replace(/^([^:]+:)/, '<b>$1</b>');
            const premiumLine = t(ctx, 'profile_premium', { status: premiumLabel }).replace(/^([^:]+:)/, '<b>$1</b>');
            const modelLine = t(ctx, 'current_model', { model: modelDisplay }).replace(/^([^:]+:)/, '<b>$1</b>');
            const langLine = t(ctx, 'current_language', { lang: getLanguageNameWithoutFlag(ctx, currentLang) }).replace(/^([^:]+:)/, '<b>$1</b>');

            const text =
                `👤 ${t(ctx, 'profile_title')}\n
` +
                `💰 ${balanceLine}
` +
                `⭐ ${premiumLine}
` +
                `${modelLine}
` +
                `${langLine}`;

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'profile_language_button'), 'profile_language')
                .text(t(ctx, 'profile_premium_button'), 'profile:premium')
                .row()
                .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
                .row()
                .text(t(ctx, 'profile_clear_button'), 'profile_clear');

            return { text, keyboard, parse_mode: 'HTML' };
        }

        if (route === 'profile_language') {
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'language_english'), 'lang_en').row()
                .text(t(ctx, 'language_russian'), 'lang_ru').row()
                .text(t(ctx, 'language_spanish'), 'lang_es').row()
                .text(t(ctx, 'language_german'), 'lang_de').row()
                .text(t(ctx, 'language_portuguese'), 'lang_pt').row()
                .text(t(ctx, 'language_french'), 'lang_fr')
                .row()
                .text(t(ctx, 'back_button'), 'ui:back');
            return { text: t(ctx, 'choose_language'), keyboard };
        }

        if (route === 'profile_clear') {
            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'clear_yes_button'), 'clear:confirm')
                .row()
                .text(t(ctx, 'back_button'), 'ui:back');
            const confirmText = t(ctx, 'clear_confirm').replace(/\*\*(.+?)\*\*/g, '*$1*');
            return { text: confirmText, keyboard, parse_mode: 'Markdown' };
        }

        if (route === 'model_connected') {
            const userId = String(ctx.from?.id);
            const selectedModel = (params?.model as string) || (await redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;
            const modelDisplayName = getModelDisplayName(selectedModel);
            const isPremium = await subscriptionService.hasActiveSubscription(userId);
            const priceWithoutSub = getPriceSP(selectedModel, false);
            const priceWithSub = getPriceSP(selectedModel, true);

            const header = t(ctx, 'model_connected_title', { model: modelDisplayName });
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
                capabilityLines.push(`🎙 <code>${t(ctx, 'capability_voice') || 'Голосовые сообщения'}</code>`);
            }

            const isFree = priceWithoutSub === 0 && priceWithSub === 0;
            const priceLine = isFree
                ? t(ctx, 'model_price_line_free')
                : (isPremium
                    ? t(ctx, 'model_price_line_with_premium', { price_without: priceWithoutSub.toFixed(3), price_with: priceWithSub.toFixed(3) })
                    : t(ctx, 'model_price_line_without_premium', { price_without: priceWithoutSub.toFixed(3), price_with: priceWithSub.toFixed(3) })
                  );

            const attachmentsNote = t(ctx, 'attachments_double_cost_note');
            const footer = t(ctx, 'chat_start_hint');

            const text = [
                header,
                '',
                capabilitiesTitle,
                capabilityLines.join('\n'),
                '',
                priceLine,
                '',
                attachmentsNote,
                '',
                footer,
            ].join('\n');

            const keyboard = new InlineKeyboard();
            if (!isPremium) {
                keyboard.text(t(ctx, 'model_buy_premium_button'), 'profile:premium').row();
            }
            keyboard.text(t(ctx, 'model_close_button'), 'model:close');

            return { text, keyboard, parse_mode: 'HTML' };
        }

        if (route === 'premium') {
            const telegramId = ctx.from?.id as number;
            const hasActive = await subscriptionService.hasActiveSubscription(String(telegramId));
            if (hasActive) {
                const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
                return { text, keyboard, parse_mode: 'HTML' };
            } else {
                const premiumText = 
                    `${t(ctx, 'premium_confirm_title')}\n\n` +
                    `${t(ctx, 'premium_confirm_benefits_title')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_1')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_2')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_3')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_4')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_5')}\n` +
                    `${t(ctx, 'premium_confirm_benefit_6')}\n\n` +
                    `${t(ctx, 'premium_confirm_footer')}`;

                const keyboard = new InlineKeyboard()
                    .text(t(ctx, 'premium_activate_button'), 'premium:activate')
                    .row()
                    .text(t(ctx, 'premium_back_button'), 'ui:back');
                return { text: premiumText, keyboard, parse_mode: 'HTML' };
            }
        }

        return { text: t(ctx, 'unexpected_error') };
    };

    const navigateTo = async (ctx: BotContext, route: RouteId, params?: RouteParams) => {
        ctx.session.uiStack = ctx.session.uiStack || [];
        if (ctx.session.currentRoute) {
            ctx.session.uiStack.push(ctx.session.currentRoute);
        }
        ctx.session.currentRoute = { route, params };
        const screen = await buildRouteScreen(ctx, route, params);
        await renderScreen(ctx, screen);
    };

    const navigateBack = async (ctx: BotContext) => {
        ctx.session.uiStack = ctx.session.uiStack || [];
        const previous = ctx.session.uiStack.pop();
        if (!previous) {
            // Если текущий экран — премиум, а стека нет, восстановим экран "модель подключена"
            if (ctx.session.currentRoute?.route === 'premium') {
                const userId = String(ctx.from?.id);
                let model = await redisService.get<string>(`chat:${userId}:model`);
                if (!model) model = DEFAULT_MODEL;
                ctx.session.currentRoute = { route: 'model_connected', params: { model } };
                const screen = await buildRouteScreen(ctx, 'model_connected', { model });
                await renderScreen(ctx, screen);
                return;
            }
            await safeAnswerCallbackQuery(ctx);
            try { await ctx.deleteMessage(); } catch {}
            return;
        }
        ctx.session.currentRoute = previous;
        const screen = await buildRouteScreen(ctx, previous.route as RouteId, previous.params);
        await renderScreen(ctx, screen);
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
        const activeSub = await subscriptionService.getActiveSubscription(String(ctx.from?.id));
        let expiresAtDate: Date | null = null;
        let autorenew = false;

        if (activeSub) {
            expiresAtDate = new Date(activeSub.periodEnd);
            autorenew = Boolean(activeSub.autoRenew);
        } else {
            // Фоллбек для старых сессий, чтобы не ломать UX
            ensurePremiumDefaults(ctx);
            expiresAtDate = new Date(ctx.session.premiumExpiresAt as string);
            autorenew = Boolean(ctx.session.premiumAutorenew);
        }

        const msLeft = (expiresAtDate?.getTime() ?? Date.now()) - Date.now();
        const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const locale = getLocaleCode(ctx);
        const expiresAt = expiresAtDate
            ? expiresAtDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/[\u2068\u2069]/g, '')
            : '';
        const autorenewLabelPlain = autorenew ? t(ctx, 'switch_on') : t(ctx, 'switch_off');
        const autorenewLabel = `<b>${autorenewLabelPlain}</b>`;

        const header = t(ctx, 'premium_active_title');
        let balance = 0;
        try { balance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
        const body = t(ctx, 'premium_active_text', {
            expires_at: expiresAt,
            days_left: String(daysLeft),
            autorenew: autorenewLabel,
            balance: String(balance),
        }).replace(/\\n/g, '\n');

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'premium_extend_30_button'), 'premium:extend')
            .row()
            .text(
                autorenew 
                    ? t(ctx, 'premium_autorenew_toggle_button_on', { on: t(ctx, 'switch_on') })
                    : t(ctx, 'premium_autorenew_toggle_button_off', { off: t(ctx, 'switch_off') }),
                'premium:toggle_autorenew'
            )
            .row()
            .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
            .row()
            .text(t(ctx, 'premium_back_button'), 'ui:back');

        const text = `${header}\n${body}`;
        return { text, keyboard };
    };

    // Кнопка поддержки всегда доступна в /help, доступ к чату — только с активным Premium

    const getPlanLimits = (ctx: BotContext, plan: string) => {
        if (plan.toLowerCase() === 'start') {
            return t(ctx, 'plan_start_limits');
        }
        return t(ctx, 'plan_custom_limits');
    };

    const replyHelp = async (ctx: BotContext) => {
        const userId = String(ctx.from?.id);
        const hasActive = await subscriptionService.hasActiveSubscription(userId);
        const keyboard = new InlineKeyboard();
        if (hasActive) {
            keyboard.url(t(ctx, 'help_contact_support_button'), 'https://t.me/setupmultisupport_bot');
        } else {
            keyboard.text(t(ctx, 'help_contact_support_button'), 'help:support');
        }
        await ctx.reply(buildHelpText(ctx), { reply_markup: keyboard });
    };

    const replyProfile = async (ctx: BotContext) => {
        const userId = String(ctx.from?.id);
        let [model] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
        ]);
        if (!model) model = DEFAULT_MODEL;

        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

        let spBalance = 0;
        try { spBalance = await setupAppService.getBalance(ctx.from?.id as number); } catch {}
        const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
        const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

        const balanceLine = t(ctx, 'profile_balance', { balance: spBalance }).replace(/^([^:]+:)/, '<b>$1</b>');
        const premiumLine = t(ctx, 'profile_premium', { status: premiumLabel }).replace(/^([^:]+:)/, '<b>$1</b>');
        const modelLine = t(ctx, 'current_model', { model: modelDisplay }).replace(/^([^:]+:)/, '<b>$1</b>');
        const langLine = t(ctx, 'current_language', { lang: getLanguageNameWithoutFlag(ctx, currentLang) }).replace(/^([^:]+:)/, '<b>$1</b>');

        const text =
            `💰 ${balanceLine}
` +
            `⭐ ${premiumLine}
` +
            `${modelLine}
` +
            `${langLine}`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_premium_button'), 'profile:premium')
            .row()
            .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
            .row()
            .text(t(ctx, 'profile_clear_button'), 'profile_clear');

        await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
    };

    const replyModelSelection = async (ctx: BotContext) => {
        const userId = String(ctx.from?.id);
        const selectedModel = (await redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;
        const keyboard = new InlineKeyboard();
        const hasActive = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
        models.forEach((model) => {
            const { power } = MODEL_INFO[model] || { price: 0, power: 0 };
            const price = getPriceSP(model, hasActive);
            const displayName = getModelDisplayName(model);
            const prefix = selectedModel === model ? '✅ ' : '';
            const priceLabel = price === 0 ? t(ctx, 'price_free_short') : `${price} SP`;
            const label = `${prefix}${displayName} • ${priceLabel} • 🧠 ${power}`;
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
            await navigateTo(ctx, 'profile');
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

    const getLanguageNameWithoutFlag = (ctx: BotContext, code: string): string => {
        const fullLabel = getLanguageLabel(ctx, code);
        return fullLabel.replace(/^(?:\uD83C[\uDDE6-\uDDFF]){2}\s*/, '').trim();
    };

    const buildHelpText = (ctx: BotContext) => {
        return (
            `${t(ctx, 'help_usage')}\n\n` +
            `${t(ctx, 'help_commands_title')}\n` +
            `${t(ctx, 'help_start')}\n` +
            `${t(ctx, 'help_help')}\n` +
            `${t(ctx, 'help_model')}\n` +
            `${t(ctx, 'help_profile')}\n` +
            `${t(ctx, 'help_language')}\n` +
            `${t(ctx, 'help_clear')}\n` +
            `${t(ctx, 'help_billing')}\n\n` +
            `${t(ctx, 'help_files')}\n\n` +
            `${t(ctx, 'help_content_rules')}`
        );
    };

    const buildMainReplyKeyboard = (ctx: BotContext) => {
        return new Keyboard()
            .text(t(ctx, 'model_selection_button'))
            .row()
            .text(t(ctx, 'profile_button'))
            .text(t(ctx, 'help_button'))
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
                await setupAppService.auth(telegramId, {
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

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'language_english'), 'lang_en').row()
                .text(t(ctx, 'language_russian'), 'lang_ru').row()
                .text(t(ctx, 'language_spanish'), 'lang_es').row()
                .text(t(ctx, 'language_german'), 'lang_de').row()
                .text(t(ctx, 'language_portuguese'), 'lang_pt').row()
                .text(t(ctx, 'language_french'), 'lang_fr');
                await ctx.reply(t(ctx, 'start_language_welcome'), { reply_markup: keyboard });
            return;
        }

        // Язык есть — гарантируем его в сессии
        ctx.session.lang = ctx.session.lang || savedLang;

        const promoTextStart = t(ctx, 'onboarding_promo', { first_name: ctx.from?.first_name || ctx.from?.username || '' });
        const promoTextStartMd = promoTextStart.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/\\n/g, '\n');

        const telegramId = ctx.from?.id as number;

        const referralCode = ctx?.match && typeof ctx.match === 'string' ? ctx.match : undefined;

        const authResult = await processUserAuth(telegramId, ctx);
        const promises: Promise<any>[] = [];
        if (referralCode && authResult.success) {
            // заглушка: если появится реализация processReferralAsync, сюда вставим
        }
        promises.push(processMenuButtonAsync(ctx, telegramId));
        await Promise.all(promises);

        await ctx.reply(promoTextStartMd, { reply_markup: buildMainReplyKeyboard(ctx), parse_mode: 'Markdown' });
    });

    bot.command('help', async (ctx) => {
        await replyHelp(ctx);
    });

    bot.command('profile', async (ctx) => {
        const userId = String(ctx.from?.id);
        let [model] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
        ]);
        if (!model) model = DEFAULT_MODEL;

        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const modelDisplay = model ? getModelDisplayName(model) : t(ctx, 'model_not_selected');

        const spBalance = 0;
        const isPremium = false;
        const premiumLabel = isPremium ? t(ctx, 'yes') : t(ctx, 'no');

        const text =
            `👤 ${t(ctx, 'profile_title')}\n
` +
            `💰 ${t(ctx, 'profile_balance', { balance: spBalance })}
` +
            `⭐ ${t(ctx, 'profile_premium', { status: premiumLabel })}
` +
            `${t(ctx, 'current_model', { model: modelDisplay })}
` +
            `${t(ctx, 'current_language', { lang: getLanguageNameWithoutFlag(ctx, currentLang) })}`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_premium_button'), 'profile:premium')
            .row()
            .text(t(ctx, 'topup_sp_button'), 'wallet:topup')
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
            .text(t(ctx, 'clear_yes_button'), 'clear:confirm')
            .row()
            .text(t(ctx, 'back_button'), 'profile:back');
        await ctx.reply(t(ctx, 'clear_confirm'), { reply_markup: keyboard, parse_mode: 'Markdown' });
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
            const isPremium = await subscriptionService.hasActiveSubscription(String(ctx.from?.id));
            const priceWithoutSub = getPriceSP(selectedModel, false);
            const priceWithSub = getPriceSP(selectedModel, true);

            const header = t(ctx, 'model_connected_title', { model: modelDisplayName });
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
                capabilityLines.push(`🎙 <code>${t(ctx, 'capability_voice') || 'Голосовые сообщения'}</code>`);
            }

            const isFree = priceWithoutSub === 0 && priceWithSub === 0;
            const priceLine = isFree
                ? t(ctx, 'model_price_line_free')
                : (isPremium
                    ? t(ctx, 'model_price_line_with_premium', { price_without: priceWithoutSub.toFixed(3), price_with: priceWithSub.toFixed(3) })
                    : t(ctx, 'model_price_line_without_premium', { price_without: priceWithoutSub.toFixed(3), price_with: priceWithSub.toFixed(3) })
                  );

            const attachmentsNote = t(ctx, 'attachments_double_cost_note');
            const footer = t(ctx, 'chat_start_hint');

            const messageHtml = [
                header,
                '',
                capabilitiesTitle,
                capabilityLines.join('\n'),
                '',
                priceLine,
                '',
                attachmentsNote,
                '',
                footer,
            ].join('\n');

            // Навигация на экран "модель подключена", чтобы Back работал из премиума
            await navigateTo(ctx, 'model_connected', { model: selectedModel });
            return;
        }

        if (data === 'model:close') {
            await safeAnswerCallbackQuery(ctx);
            try { await ctx.deleteMessage(); } catch {}
            return;
        }

        if (data === 'menu_help') {
            // Открываем помощь новым сообщением и фиксируем маршрут для корректного Back
            await safeAnswerCallbackQuery(ctx);
            ctx.session.uiStack = ctx.session.uiStack || [];
            if (ctx.session.currentRoute) {
                ctx.session.uiStack.push(ctx.session.currentRoute);
            }
            ctx.session.currentRoute = { route: 'help' as any };
            await replyHelp(ctx);
            return;
        }
        if (data === 'help:support') {
            await safeAnswerCallbackQuery(ctx);
            const userId = String(ctx.from?.id);
            const hasActive = await subscriptionService.hasActiveSubscription(userId);
            if (!hasActive) {
                const kb = new InlineKeyboard().text(t(ctx, 'model_buy_premium_button'), 'profile:premium');
                await ctx.reply(t(ctx, 'support_premium_required'), { reply_markup: kb });
                return;
            }
            // Для premium пользователей в /help уже показана URL-кнопка, сюда не попадём
            // На всякий случай дублируем ответ ссылкой
            const kb = new InlineKeyboard().url(t(ctx, 'help_contact_support_button'), 'https://t.me/setupmultisupport_bot');
            await ctx.reply(t(ctx, 'help_contact_support_button'), { reply_markup: kb });
            return;
        }
        if (data === 'menu_profile') {
            // Отвечаем новым сообщением, не редактируя/удаляя исходное меню
            ctx.session.uiStack = ctx.session.uiStack || [];
            if (ctx.session.currentRoute) {
                ctx.session.uiStack.push(ctx.session.currentRoute);
            }
            ctx.session.currentRoute = { route: 'profile' };
            const screen = await buildRouteScreen(ctx, 'profile');
            await safeAnswerCallbackQuery(ctx);
            await ctx.reply(screen.text, { reply_markup: screen.keyboard, parse_mode: screen.parse_mode });
            return;
        }
        if (data === 'menu_model') {
            await safeAnswerCallbackQuery(ctx);
            await replyModelSelection(ctx);
            return;
        }

        if (data === 'profile:premium') {
            // Если текущий маршрут не установлен (например, пришли из сообщения без навигации), 
            // восстановим контекст как "model_connected", чтобы Back вернул к нему.
            ctx.session.uiStack = ctx.session.uiStack || [];
            if (!ctx.session.currentRoute) {
                const userId = String(ctx.from?.id);
                let model = await redisService.get<string>(`chat:${userId}:model`);
                if (!model) model = DEFAULT_MODEL;
                ctx.session.currentRoute = { route: 'model_connected', params: { model } };
            }
            await navigateTo(ctx, 'premium');
            return;
        }

        if (data === 'profile_clear') {
            await navigateTo(ctx, 'profile_clear');
            return;
        }

        if (data === 'clear:confirm') {
            await safeAnswerCallbackQuery(ctx);
            const userId = String(ctx.from?.id);
            await redisService.clearHistory(userId);
            try { await ctx.deleteMessage(); } catch {}
            await ctx.reply(t(ctx, 'context_cleared'), { parse_mode: 'Markdown' });
            return;
        }

        if (data === 'clear:cancel') {
            await navigateBack(ctx);
            return;
        }

        if (data === 'profile:back') {
            await navigateBack(ctx);
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
            try { await ctx.deleteMessage(); } catch {}

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
                const promoText = t(ctx, 'onboarding_promo', { first_name: ctx.from?.first_name || ctx.from?.username || '' });
                const promoTextMd = promoText.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/\\n/g, '\n');
                await ctx.reply(promoTextMd, { reply_markup: buildMainReplyKeyboard(ctx), parse_mode: 'Markdown' });
            } else if (prevLang !== selected) {
                // Смена языка: короткое сообщение и обновление reply-клавиатуры
                await ctx.reply(
                    t(ctx, 'language_switched', { language: t(ctx, languageKey) }),
                    { reply_markup: buildMainReplyKeyboard(ctx) }
                );
            }
        }

        if (data === 'profile_language') {
            await navigateTo(ctx, 'profile_language');
            return;
        }

        if (data === 'profile_change_plan') {
            await safeAnswerCallbackQuery(ctx);
            await ctx.reply(t(ctx, 'change_plan_coming_soon'));
            return;
        }

        if (data === 'premium:activate') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = ctx.from?.id as number;

            if (!telegramId) {
                await ctx.reply(t(ctx, 'unexpected_error'));
                return;
            }

            try {
                const alreadyActive = await subscriptionService.hasActiveSubscription(String(telegramId));
                if (alreadyActive) {
                    const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
                    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
                    return;
                }

                // Добавляем текущий экран в стек перед переходом к подтверждению
                ctx.session.uiStack = ctx.session.uiStack || [];
                if (ctx.session.currentRoute) {
                    ctx.session.uiStack.push(ctx.session.currentRoute);
                }

                const keyboard = new InlineKeyboard()
                    .text(t(ctx, 'premium_confirm_yes'), 'premium:confirm_buy')
                    .row()
                    .text(t(ctx, 'premium_confirm_no'), 'premium:cancel_buy');
                
                try {
                    await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
                } catch {
                    // Если не удалось отредактировать, отправим новое сообщение с минимальным текстом
                    try { await ctx.deleteMessage(); } catch {}
                    await ctx.reply('💎', { reply_markup: keyboard });
                }
            } catch (error) {
                console.error('premium:activate confirm prepare failed', error);
                await ctx.reply(t(ctx, 'unexpected_error'));
            }
            return;
        }



        if (data === 'premium:cancel_buy') {
            // Возвращаемся к экрану премиума
            ctx.session.currentRoute = { route: 'premium' };
            const screen = await buildRouteScreen(ctx, 'premium');
            await renderScreen(ctx, screen);
            return;
        }

        if (data === 'premium:confirm_buy') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = ctx.from?.id as number;
            try {
                const alreadyActive = await subscriptionService.hasActiveSubscription(String(telegramId));
                if (alreadyActive) {
                    const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
                    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
                    return;
                }

                const hasEnough = await setupAppService.have(telegramId, PREMIUM_SUBSCRIPTION_COST_SP);
                if (!hasEnough) {
                    const currentBalance = await setupAppService.getBalance(telegramId);
                    const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'billing:topup');
                    await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard, parse_mode: 'HTML' });
                    return;
                }

                await subscriptionService.chargeAndCreateSubscription(
                    telegramId,
                    PREMIUM_SUBSCRIPTION_COST_SP,
                    'Подписка "Premium" 10 SP на Multimodal bot',
                    { periodDays: 30, autoRenew: false }
                );

                const keyboard = new InlineKeyboard()
                    .text(t(ctx, 'premium_enable_autorenew_button'), 'premium:enable_autorenew')
                    .row()
                    .text(t(ctx, 'premium_later_button'), 'profile:back');
                await ctx.reply(t(ctx, 'premium_activated_success'), { reply_markup: keyboard });
            } catch (error: any) {
                const message = String(error?.message || '');
                if (message.includes('INSUFFICIENT_FUNDS')) {
                    const currentBalance = await setupAppService.getBalance(telegramId);
                    const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'billing:topup');
                    await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard, parse_mode: 'HTML' });
                } else if (message.includes('ALREADY_HAS_ACTIVE_SUBSCRIPTION')) {
                    const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
                    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
                } else {
                    console.error('premium:confirm_buy failed', error);
                    await ctx.reply(t(ctx, 'unexpected_error'));
                }
            }
            return;
        }

        if (data === 'premium:back') {
            await navigateBack(ctx);
            return;
        }

        if (data === 'premium:enable_autorenew') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = String(ctx.from?.id);
            const updated = await subscriptionService.setAutoRenew(telegramId, true);
            const locale = getLocaleCode(ctx);
            let expiresAt = '';
            if (updated?.periodEnd) {
                const expires = new Date(updated.periodEnd);
                expiresAt = expires.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/[\u2068\u2069]/g, '');
            }
            const msg = t(ctx, 'premium_autorenew_enabled', { expires_at: expiresAt }).replace(/\\n/g, '\n');
            try {
                await ctx.editMessageText(msg);
            } catch {
                try { await ctx.deleteMessage(); } catch {}
                await ctx.reply(msg);
            }
            return;
        }

        if (data === 'premium:toggle_autorenew') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = String(ctx.from?.id);
            const activeSub = await subscriptionService.getActiveSubscription(telegramId);
            const current = Boolean(activeSub?.autoRenew);
            const targetEnable = !current;
            const locale = getLocaleCode(ctx);
            const expiresAt = activeSub?.periodEnd
                ? new Date(activeSub.periodEnd).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/[\u2068\u2069]/g, '')
                : '';
            const confirmText = targetEnable
                ? t(ctx, 'premium_autorenew_confirm_enable', { expires_at: expiresAt }).replace(/\\n/g, '\n')
                : t(ctx, 'premium_autorenew_confirm_disable', { expires_at: expiresAt }).replace(/\\n/g, '\n');
            const kb = new InlineKeyboard()
                .text(t(ctx, 'premium_autorenew_confirm_yes'), targetEnable ? 'premium:autorenew:set_on' : 'premium:autorenew:set_off')
                .row()
                .text(t(ctx, 'premium_autorenew_confirm_no'), 'premium:autorenew:cancel');
            await renderScreen(ctx, { text: confirmText, keyboard: kb, parse_mode: 'HTML' });
            return;
        }

        if (data === 'premium:autorenew:set_on') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = String(ctx.from?.id);
            await subscriptionService.setAutoRenew(telegramId, true);
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' }); } catch { try { await ctx.deleteMessage(); } catch {} await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' }); }
            return;
        }

        if (data === 'premium:autorenew:set_off') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = String(ctx.from?.id);
            await subscriptionService.setAutoRenew(telegramId, false);
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' }); } catch { try { await ctx.deleteMessage(); } catch {} await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' }); }
            return;
        }

        if (data === 'premium:autorenew:cancel') {
            await safeAnswerCallbackQuery(ctx);
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' }); } catch { try { await ctx.deleteMessage(); } catch {} await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' }); }
            return;
        }

        if (data === 'premium:extend') {
            await safeAnswerCallbackQuery(ctx);
            const telegramId = ctx.from?.id as number;
            const hasEnough = await setupAppService.have(telegramId, PREMIUM_SUBSCRIPTION_COST_SP);
            if (!hasEnough) {
                const currentBalance = await setupAppService.getBalance(telegramId);
                const keyboard = new InlineKeyboard().text(t(ctx, 'topup_sp_button'), 'wallet:topup');
                await ctx.reply(t(ctx, 'premium_insufficient_sp', { balance: currentBalance }), { reply_markup: keyboard, parse_mode: 'HTML' });
                return;
            }
            ensurePremiumDefaults(ctx);
            const current = new Date(ctx.session.premiumExpiresAt as string);
            const extended = new Date(current.getTime() + 30 * 24 * 60 * 60 * 1000);
            ctx.session.premiumExpiresAt = extended.toISOString();
            const { text, keyboard } = await buildPremiumActiveTextAndKeyboard(ctx);
            try { await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: 'HTML' }); } catch { try { await ctx.deleteMessage(); } catch {} await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' }); }
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

        if (data === 'ui:back') {
            await navigateBack(ctx);
            return;
        }
    });
}



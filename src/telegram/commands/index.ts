import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { models } from '../constants';
import { AppType } from '@setup-app-repo/setup.app-sdk';
import { UserService } from 'src/user/user.service';
import { getModelDisplayName } from '../utils/model-display';

type TranslateFn = (ctx: BotContext, key: string, args?: Record<string, any>) => string;

export interface RegisterCommandsDeps {
    t: TranslateFn;
    i18n: I18nService;
    redisService: RedisService;
    setupAppService: SetupAppService;
    userService: UserService;
}

export function registerCommands(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
    const { t, i18n, redisService, setupAppService, userService } = deps;

    const getPlanLimits = (ctx: BotContext, plan: string) => {
        if (plan.toLowerCase() === 'start') {
            return t(ctx, 'plan_start_limits');
        }
        return t(ctx, 'plan_custom_limits');
    };

    const replyHelp = async (ctx: BotContext) => {
        await ctx.reply(buildHelpText(ctx));
    };

    const replyProfile = async (ctx: BotContext) => {
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
    };

    const replyModelSelection = async (ctx: BotContext) => {
        const keyboard = new InlineKeyboard();
        models.forEach((model) => {
            const displayName = getModelDisplayName(model);
            keyboard.text(displayName, `model_${model}`).row();
        });
        await ctx.reply(t(ctx, 'select_model'), { reply_markup: keyboard });
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
            `${t(ctx, 'help_models')}\n\n` +
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
            console.log('isNewUser', isNewUser);
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
                await userService.findOrCreateUser(String(ctx.from.id), {
                    telegramId: String(ctx.from.id),
                    username: ctx.from.username,
                    firstName: ctx.from.first_name || 'User',
                    lastName: ctx.from.last_name,
                    languageCode: ctx.from.language_code,
                    isPremium: ctx.from.is_premium || false,
                });
                console.debug(`User ensured in DB: ${ctx.from.id}`);
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
        const onboardingKeyboardStart = new InlineKeyboard()
            .text(t(ctx, 'onboarding_choose_model_button'), 'menu_model');

        const telegramId = ctx.from?.id as number;

        const referralCode = ctx?.match && typeof ctx.match === 'string' ? ctx.match : undefined;

        const authResult = await processUserAuth(telegramId, ctx);
        const promises: Promise<any>[] = [];
        if (referralCode && authResult.success) {
            // заглушка: если появится реализация processReferralAsync, сюда вставим
        }
        promises.push(processMenuButtonAsync(ctx, telegramId));
        await Promise.all(promises);

        await ctx.reply(promoTextStart, { reply_markup: onboardingKeyboardStart });
    });

    bot.command('help', async (ctx) => {
        await ctx.reply(buildHelpText(ctx));
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
        const userId = String(ctx.from?.id);
        await redisService.clearHistory(userId);
        await ctx.reply(t(ctx, 'context_cleared'));
    });

    bot.command('model', async (ctx) => {
        const keyboard = new InlineKeyboard();
        models.forEach((model) => {
            const displayName = getModelDisplayName(model);
            keyboard.text(displayName, `model_${model}`).row();
        });
        await ctx.reply(t(ctx, 'select_model'), { reply_markup: keyboard });
    });

    bot.on('callback_query:data', async (ctx) => {
        const data = ctx.callbackQuery.data;

        if (data.startsWith('model_')) {
            const selectedModel = data.replace('model_', '');
            if (!models.includes(selectedModel)) {
                await ctx.answerCallbackQuery({ text: t(ctx, 'invalid_model'), show_alert: true });
                return;
            }
            await redisService.set(`chat:${String(ctx.from?.id)}:model`, selectedModel, 60 * 60);
            await ctx.answerCallbackQuery();
            const modelDisplayName = getModelDisplayName(selectedModel);
            await ctx.reply(t(ctx, 'model_selected', { model: modelDisplayName }), { parse_mode: 'Markdown' });
            return;
        }

        if (data === 'menu_help') {
            await ctx.answerCallbackQuery();
            await ctx.reply(buildHelpText(ctx));
            return;
        }
        if (data === 'menu_profile') {
            await ctx.answerCallbackQuery();
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
            return;
        }
        if (data === 'menu_model') {
            await ctx.answerCallbackQuery();
            const keyboard = new InlineKeyboard();
            models.forEach((model) => {
                const displayName = getModelDisplayName(model);
                keyboard.text(displayName, `model_${model}`).row();
            });
            await ctx.reply(t(ctx, 'select_model'), { reply_markup: keyboard });
            return;
        }

        if (data === 'profile:premium') {
            await ctx.answerCallbackQuery();
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
            return;
        }

        if (data === 'profile_clear') {
            await ctx.answerCallbackQuery();
            const userId = String(ctx.from?.id);
            await redisService.clearHistory(userId);
            await ctx.reply(t(ctx, 'context_cleared'));
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
            await ctx.answerCallbackQuery();

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
                // Первый выбор языка: показываем онбординг и CTA
                const promoText = t(ctx, 'onboarding_promo', { first_name: ctx.from?.first_name || ctx.from?.username || '' }).replace(/\\n/g, '\n');
                const onboardingKeyboard = new InlineKeyboard()
                    .text(t(ctx, 'onboarding_choose_model_button'), 'menu_model');
                await ctx.reply(promoText, { reply_markup: onboardingKeyboard });
            } else if (prevLang !== selected) {
                // Смена языка: короткое сообщение и обновление reply-клавиатуры
                await ctx.reply(
                    t(ctx, 'language_switched', { language: t(ctx, languageKey) }),
                    { reply_markup: buildMainReplyKeyboard(ctx) }
                );
            }
        }

        if (data === 'profile_language') {
            await ctx.answerCallbackQuery();
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
            await ctx.answerCallbackQuery();
            await ctx.reply(t(ctx, 'change_plan_coming_soon'));
            return;
        }

        if (data === 'premium:activate') {
            await ctx.answerCallbackQuery();
            // Пока ничего не делаем по требованию
            await ctx.reply(t(ctx, 'premium_activation_coming_soon'));
            return;
        }

        if (data === 'premium:back') {
            await ctx.answerCallbackQuery();
            // Возвращаемся в профиль
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
            return;
        }
    });
}



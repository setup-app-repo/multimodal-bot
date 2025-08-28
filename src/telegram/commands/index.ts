import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { I18nService } from 'src/i18n/i18n.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { models } from '../constants';
import { AppType } from '@setup-app-repo/setup.app-sdk';

type TranslateFn = (ctx: BotContext, key: string, args?: Record<string, any>) => string;

export interface RegisterCommandsDeps {
    t: TranslateFn;
    i18n: I18nService;
    redisService: RedisService;
    setupAppService: SetupAppService;
}

export function registerCommands(bot: Bot<BotContext>, deps: RegisterCommandsDeps) {
    const { t, i18n, redisService, setupAppService } = deps;

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
        const [model, plan] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
            redisService.get<string>(`chat:${userId}:plan`),
        ]);

        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const currentPlan = plan || 'Start';
        const limits = getPlanLimits(ctx, currentPlan);
        const modelDisplay = model ? getModelDisplayName(ctx, model) : t(ctx, 'model_not_selected');

        const text =
            `🤖 ${t(ctx, 'current_model', { model: modelDisplay })}\n` +
            `🌐 ${t(ctx, 'current_language', { lang: currentLang })}\n` +
            `📦 ${t(ctx, 'current_plan', { plan: currentPlan })}\n` +
            `⚡ ${t(ctx, 'current_limits', { limits: limits })}\n`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_change_plan_button'), 'profile_change_plan');

        await ctx.reply(text, { reply_markup: keyboard });
    };

    const replyModelSelection = async (ctx: BotContext) => {
        const keyboard = new InlineKeyboard();
        models.forEach((model) => {
            const displayName = getModelDisplayName(ctx, model);
            keyboard.text(displayName, `model_${model}`).row();
        });
        await ctx.reply(t(ctx, 'select_model'), { reply_markup: keyboard });
    };

    // Обработка нажатий reply-клавиатуры
    bot.on('message:text', async (ctx, next) => {
        const text = ctx.message.text;
        const helpBtn = t(ctx, 'help_button');
        const profileBtn = t(ctx, 'profile_button');
        const modelBtn = t(ctx, 'model_selection_button');

        if (text === helpBtn) {
            await replyHelp(ctx);
            return; // не передаём дальше
        }
        if (text === profileBtn) {
            await replyProfile(ctx);
            return;
        }
        if (text === modelBtn) {
            await replyModelSelection(ctx);
            return;
        }
        return next();
    });

    const getModelDisplayName = (ctx: BotContext, model: string): string => {
        const modelNames: { [key: string]: string } = {
            'deepseek/deepseek-chat-v3.1': t(ctx, 'model_deepseek'),
            'openai/gpt-5': t(ctx, 'model_gpt5'),
            'anthropic/claude-sonnet-4': t(ctx, 'model_claude_sonnet'),
            'x-ai/grok-4': t(ctx, 'model_grok'),
            'openai/gpt-5-mini': t(ctx, 'model_gpt5_mini')
        };
        return modelNames[model] || model;
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

    const processUserAuth = async (telegramId: number, ctx: BotContext): Promise<{ success: boolean; isNewUser: boolean }> => {
        try {
            if (!setupAppService.isInitialized()) {
                console.warn(`⚠️ Setup.app service not initialized, skipping user auth for ${telegramId}`);
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
            console.error(`❌ Error during Setup.app authentication for user ${telegramId}:`, error);
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
            await ctx.reply(t(ctx, 'choose_language'), { reply_markup: keyboard });
            return;
        }

        // Язык есть — гарантируем его в сессии
        ctx.session.lang = ctx.session.lang || savedLang;

        const currentModel = model || t(ctx, 'model_not_selected');
        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const currentPlan = plan || 'Start';
        const limits = getPlanLimits(ctx, currentPlan);

        const modelDisplay = model ? getModelDisplayName(ctx, model) : t(ctx, 'model_not_selected');

        const text =
            `${t(ctx, 'welcome')}\n\n` +
            `${t(ctx, 'welcome_description')}\n\n` +
            `🤖 ${t(ctx, 'current_model', { model: modelDisplay })}\n` +
            `🌐 ${t(ctx, 'current_language', { lang: currentLang })}\n` +
            `📦 ${t(ctx, 'current_plan', { plan: currentPlan })}\n` +
            `⚡ ${t(ctx, 'current_limits', { limits: limits })}\n`;

        const telegramId = ctx.from?.id as number;

        const url = new URL(`https://t.me/${ctx.me.username}`);
        const referralCode = ctx?.match && typeof ctx.match === 'string' ? ctx.match : undefined;

        const authResult = await processUserAuth(telegramId, ctx);
        const promises: Promise<any>[] = [];
        if (referralCode && authResult.success) {
            // заглушка: если появится реализация processReferralAsync, сюда вставим
        }
        promises.push(processMenuButtonAsync(ctx, telegramId));
        await Promise.all(promises);

        await ctx.reply(text, { reply_markup: buildMainReplyKeyboard(ctx) });
    });

    bot.command('help', async (ctx) => {
        await ctx.reply(buildHelpText(ctx));
    });

    bot.command('profile', async (ctx) => {
        const userId = String(ctx.from?.id);
        const [model, plan] = await Promise.all([
            redisService.get<string>(`chat:${userId}:model`),
            redisService.get<string>(`chat:${userId}:plan`),
        ]);

        const currentModel = model || t(ctx, 'model_not_selected');
        const currentLang = ctx.session.lang || i18n.getDefaultLocale();
        const currentPlan = plan || 'Start';
        const limits = getPlanLimits(ctx, currentPlan);

        const modelDisplay = model ? getModelDisplayName(ctx, model) : t(ctx, 'model_not_selected');

        const text =
            `🤖 ${t(ctx, 'current_model', { model: modelDisplay })}\n` +
            `🌐 ${t(ctx, 'current_language', { lang: currentLang })}\n` +
            `📦 ${t(ctx, 'current_plan', { plan: currentPlan })}\n` +
            `⚡ ${t(ctx, 'current_limits', { limits: limits })}\n`;

        const keyboard = new InlineKeyboard()
            .text(t(ctx, 'profile_language_button'), 'profile_language')
            .text(t(ctx, 'profile_change_plan_button'), 'profile_change_plan');

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
            const displayName = getModelDisplayName(ctx, model);
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
            const modelDisplayName = getModelDisplayName(ctx, selectedModel);
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
            const [model, plan] = await Promise.all([
                redisService.get<string>(`chat:${userId}:model`),
                redisService.get<string>(`chat:${userId}:plan`),
            ]);

            const currentModel = model || t(ctx, 'model_not_selected');
            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            const currentPlan = plan || 'Start';
            const limits = getPlanLimits(ctx, currentPlan);

            const modelDisplay = model ? getModelDisplayName(ctx, model) : t(ctx, 'model_not_selected');

            const text =
                `🤖 ${t(ctx, 'current_model', { model: modelDisplay })}\n` +
                `🌐 ${t(ctx, 'current_language', { lang: currentLang })}\n` +
                `📦 ${t(ctx, 'current_plan', { plan: currentPlan })}\n` +
                `⚡ ${t(ctx, 'current_limits', { limits: limits })}\n`;

            const keyboard = new InlineKeyboard()
                .text(t(ctx, 'profile_language_button'), 'profile_language')
                .text(t(ctx, 'profile_change_plan_button'), 'profile_change_plan');

            await ctx.reply(text, { reply_markup: keyboard });
            return;
        }
        if (data === 'menu_model') {
            await ctx.answerCallbackQuery();
            const keyboard = new InlineKeyboard();
            models.forEach((model) => {
                const displayName = getModelDisplayName(ctx, model);
                keyboard.text(displayName, `model_${model}`).row();
            });
            await ctx.reply(t(ctx, 'select_model'), { reply_markup: keyboard });
            return;
        }

        if (data.startsWith('lang_')) {
            const selected = data.replace('lang_', '');
            const userId = String(ctx.from?.id);
            ctx.session.lang = selected;
            
            // Сохраняем выбранный язык в Redis для постоянного хранения
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
            // После смены языка — также переустановим кнопку меню
            await setupAppService.setupMenuButton(ctx as any, { language: selected });
            // После выбора языка отправляем основной инфо-блок
            const [model, plan] = await Promise.all([
                redisService.get<string>(`chat:${userId}:model`),
                redisService.get<string>(`chat:${userId}:plan`),
            ]);

            const currentModel = model || t(ctx, 'model_not_selected');
            const currentLang = ctx.session.lang || i18n.getDefaultLocale();
            const currentPlan = plan || 'Start';
            const limits = getPlanLimits(ctx, currentPlan);
            const modelDisplay = model ? getModelDisplayName(ctx, model) : t(ctx, 'model_not_selected');

            const text =
                `🤖 ${t(ctx, 'current_model', { model: modelDisplay })}\n` +
                `🌐 ${t(ctx, 'current_language', { lang: currentLang })}\n` +
                `📦 ${t(ctx, 'current_plan', { plan: currentPlan })}\n` +
                `⚡ ${t(ctx, 'current_limits', { limits: limits })}\n`;

            await ctx.reply(text, { reply_markup: buildMainReplyKeyboard(ctx) });
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
    });
}



import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'src/i18n/i18n.service';
import { RedisService } from 'src/redis/redis.service';
import { BotContext } from '../interfaces';
import { Filter } from 'grammy';
import { OpenRouterService } from 'src/openrouter/openrouter.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SetupAppService } from 'src/setup-app/setup-app.service';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MODEL, getPriceSP, MODEL_TO_TIER, ModelTier, DAILY_BASE_FREE_LIMIT, MODELS_SUPPORTING_AUDIO } from '../constants';
import { getModelDisplayName } from '../utils/model-display';
import { escapeMarkdown, sendLongMessage } from '../utils/message';
import { AudioConversionService } from './audio-conversion.service';

@Injectable()
export class VoiceHandlerService {
    private readonly logger = new Logger(VoiceHandlerService.name);

    constructor(
        private readonly i18n: I18nService,
        private readonly redisService: RedisService,
        private readonly openRouterService: OpenRouterService,
        private readonly subscriptionService: SubscriptionService,
        private readonly setupAppService: SetupAppService,
        private readonly configService: ConfigService,
        private readonly audioConversionService: AudioConversionService,
    ) {}

    private t(ctx: BotContext, key: string, args?: Record<string, any>): string {
        const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
        return this.i18n.t(key, userLang, args);
    }

    async handleVoice(ctx: Filter<BotContext, 'message:voice'>) {
        try {
            this.logger.log('STAAAAAART >>>>>', ctx.message);
            const voice = ctx.message.voice;
            if (!voice) return;

            const userId = String(ctx.from?.id);
            const model = (await this.redisService.get<string>(`chat:${userId}:model`)) || DEFAULT_MODEL;

            if (!MODELS_SUPPORTING_AUDIO.has(model)) {
                await ctx.reply(this.t(ctx, 'warning_model_no_file_support'));
                return;
            }

            this.logger.log(`Voice message from user ${userId}: file_id=${voice.file_id}, duration=${voice.duration}s, size=${voice.file_size || 0}`);

            const file = await ctx.api.getFile(voice.file_id);
            if (!file?.file_path) return;

            const token = this.configService.get<string>('BOT_TOKEN');
            const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
            const resp = await fetch(fileUrl);
            const inputBuffer = Buffer.from(await resp.arrayBuffer());

            // Конвертация .ogg/.oga (Opus) -> .mp3
            let convertedBuffer: Buffer;
            let format: 'mp3' | 'wav' = 'mp3';
            if (file.file_path.endsWith('.ogg') || file.file_path.endsWith('.oga')) {
                this.logger.log(`Converting OGG/OGA (Opus) to mp3 for user ${userId}`);
                convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
                format = 'mp3';
            } else if (file.file_path.endsWith('.wav')) {
                convertedBuffer = inputBuffer;
                format = 'wav';
            } else if (file.file_path.endsWith('.mp3')) {
                convertedBuffer = inputBuffer;
                format = 'mp3';
            } else {
                // На всякий случай: пробуем как ogg->mp3
                this.logger.log(`Unknown extension for voice ${file.file_path}, attempting ogg->mp3 conversion`);
                convertedBuffer = await this.audioConversionService.oggOpusToMp3(inputBuffer);
                format = 'mp3';
            }

            const base64Audio = convertedBuffer.toString('base64');

            const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
            const basePrice = getPriceSP(model, hasActiveSubscription);
            const price = basePrice * 2; // Удваиваем стоимость для голосовых сообщений
            const tier = MODEL_TO_TIER[model] ?? ModelTier.MID;
            const isBaseNoSub = !hasActiveSubscription && tier === ModelTier.BASE;

            const hasEnoughSP = await this.setupAppService.have(Number(userId), price);
            if (!hasEnoughSP && !isBaseNoSub) {
                await ctx.reply(this.t(ctx, 'insufficient_funds'));
                return;
            }

            if (isBaseNoSub) {
                try {
                    const usedToday = await this.redisService.incrementDailyBaseCount(userId);
                    if (usedToday > DAILY_BASE_FREE_LIMIT) {
                        await ctx.reply(this.t(ctx, 'daily_limit_reached'));
                        return;
                    }
                } catch {}
            }

            await ctx.api.sendChatAction(ctx.chat.id, 'typing');
            const processingMessage = await ctx.reply(this.t(ctx, 'processing_request'));

            const history = await this.redisService.getHistory(userId);
            const answer = await this.openRouterService.askWithAudio(history, model, base64Audio, format, undefined);

            try { await ctx.api.deleteMessage(ctx.chat.id, processingMessage.message_id); } catch {}

            if (tier !== ModelTier.BASE) {
                const description = `Query to ${model} (audio)`;
                await this.setupAppService.deduct(Number(userId), price, description);
            }

            await this.redisService.saveMessage(userId, 'user', '[голосовое сообщение]');
            await this.redisService.saveMessage(userId, 'assistant', answer);

            const modelDisplayName = getModelDisplayName(model);
            const modelInfo = ` 🤖 **${this.t(ctx, 'model')}:** ${modelDisplayName}\n\n`;
            const safeAnswer = escapeMarkdown(answer);
            await sendLongMessage(
                ctx,
                (key: string, args?: Record<string, any>) => this.t(ctx, key, args),
                modelInfo + safeAnswer,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            this.logger.error(`Error processing voice from user ${String(ctx.from?.id)}:`, error as any);
            try { await ctx.reply(this.t(ctx, 'error_processing_file')); } catch {}
        }
    }
}



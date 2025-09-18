import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';

import { registerCommands } from 'src/telegram/commands';
import { BotContext } from 'src/telegram/interfaces';
import { DocumentHandlerService } from 'src/telegram/services/document-handler.service';
import { MessageHandlerService } from 'src/telegram/services/message-handler.service';
import { PhotoHandlerService } from 'src/telegram/services/photo-handler.service';
import { VoiceHandlerService } from 'src/telegram/services/voice-handler.service';
import { AudioHandlerService } from 'src/telegram/services/audio-handler.service';
import { RegisterCommandsDeps } from 'src/telegram/commands/utils';
import { I18nService } from 'src/i18n/i18n.service';

@Injectable()
export class BotHandlerRegistrationService {
    constructor(
        private readonly i18n: I18nService,
        private readonly messageHandler: MessageHandlerService,
        private readonly documentHandler: DocumentHandlerService,
        private readonly photoHandler: PhotoHandlerService,
        private readonly voiceHandler: VoiceHandlerService,
        private readonly audioHandler: AudioHandlerService,
    ) { }

    registerAll(bot: Bot<BotContext>, deps: RegisterCommandsDeps): void {
        registerCommands(bot, deps);

        bot.on('message:text', (ctx) => this.messageHandler.handleText(ctx));
        bot.on('message:document', (ctx) => this.documentHandler.handleDocument(ctx));
        bot.on('message:photo', (ctx) => this.photoHandler.handlePhoto(ctx));
        bot.on('message:voice', (ctx) => this.voiceHandler.handleVoice(ctx));
        bot.on('message:audio', (ctx) => this.audioHandler.handleAudio(ctx));
        bot.on('message:video', async (ctx) => {
            try {
                const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
                await ctx.reply(this.i18n.t('warning_unsupported_file_type', userLang));
            } catch { }
        });
        bot.on('message:video_note', async (ctx) => {
            try {
                const userLang = ctx.session?.lang || this.i18n.getDefaultLocale();
                await ctx.reply(this.i18n.t('warning_unsupported_file_type', userLang));
            } catch { }
        });
        bot.catch((err) => this.messageHandler.handleError(err));
    }
}



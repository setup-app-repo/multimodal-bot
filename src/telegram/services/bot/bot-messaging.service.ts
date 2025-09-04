import { Injectable } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';

import { I18nService } from 'src/i18n/i18n.service';
import { BotInstanceService } from './bot-instance.service';

@Injectable()
export class BotMessagingService {
    constructor(
        private readonly botInstance: BotInstanceService,
        private readonly i18n: I18nService,
    ) { }

    async sendPlainText(telegramId: number, text: string): Promise<void> {
        const bot = this.botInstance.getBot();
        await bot.api.sendMessage(telegramId, text, { parse_mode: 'HTML' });
    }

    async sendTextWithButton(
        telegramId: number,
        text: string,
        button: InlineKeyboard,
    ): Promise<void> {
        const bot = this.botInstance.getBot();
        await bot.api.sendMessage(telegramId, text, {
            reply_markup: button,
            parse_mode: 'HTML',
        });
    }

    async sendTextWithTopupButton(
        telegramId: number,
        text: string,
        locale?: string,
    ): Promise<void> {
        const label = this.i18n.t('premium_renew_button', locale);
        const keyboard = new InlineKeyboard().text(label, 'wallet:topup');
        await this.sendTextWithButton(telegramId, text, keyboard);
    }
}



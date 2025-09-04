import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { BotContext } from 'src/telegram/interfaces';

@Injectable()
export class BotWebhookService {
    private readonly logger = new Logger(BotWebhookService.name);

    constructor(private readonly configService: ConfigService) { }

    async setupWebhook(bot: Bot<BotContext>): Promise<void> {
        const webhookBase = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
        const secret = this.configService.get<string>('TELEGRAM_SECRET_KEY');

        if (!webhookBase || !secret) {
            this.logger.warn(
                'TELEGRAM_WEBHOOK_URL или TELEGRAM_SECRET_KEY не заданы, вебхук не будет установлен. Бот будет работать в режиме polling.',
            );
            return;
        }

        const webhookUrl = `${webhookBase}/telegram/webhook/${secret}`;
        try {
            const result = await bot.api.setWebhook(webhookUrl);
            if (result) {
                this.logger.log(`✅ Вебхук успешно установлен: ${webhookUrl}`);
                const webhookInfo = await bot.api.getWebhookInfo();
                this.logger.log('Информация о вебхуке:', {
                    url: webhookInfo.url,
                    hasCustomCertificate: webhookInfo.has_custom_certificate,
                    pendingUpdateCount: webhookInfo.pending_update_count,
                    lastErrorDate: webhookInfo.last_error_date,
                    lastErrorMessage: webhookInfo.last_error_message,
                });
            } else {
                this.logger.error('❌ Ошибка установки вебхука');
            }
        } catch (error) {
            this.logger.error('❌ Ошибка при установке вебхука:', error);
            this.logger.warn('Попробуйте установить вебхук вручную через Telegram Bot API');
        }
    }

    async handleWebhookUpdate(bot: Bot<BotContext>, update: any): Promise<void> {
        try {
            await bot.handleUpdate(update);
        } catch (error) {
            this.logger.error('Error handling webhook update:', error);
            throw error;
        }
    }
}



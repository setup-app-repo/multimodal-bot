import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { BotContext } from 'src/telegram/interfaces';

@Injectable()
export class BotInstanceService {
    private readonly logger = new Logger(BotInstanceService.name);
    private bot: Bot<BotContext> | null = null;

    constructor(private readonly configService: ConfigService) { }

    createBot(): Bot<BotContext> {
        if (this.bot) {
            return this.bot;
        }

        const token = this.configService.get<string>('BOT_TOKEN');
        if (!token) {
            this.logger.error('BOT_TOKEN is required');
            throw new Error('BOT_TOKEN is required');
        }

        this.logger.log('Initializing bot with token...');
        this.bot = new Bot<BotContext>(token);
        return this.bot;
    }

    getBot(): Bot<BotContext> {
        if (!this.bot) {
            throw new Error('Bot is not initialized');
        }
        return this.bot;
    }
}



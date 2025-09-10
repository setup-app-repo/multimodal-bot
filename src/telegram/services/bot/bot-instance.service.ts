import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { BotContext } from 'src/telegram/interfaces';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class BotInstanceService {
    private bot: Bot<BotContext> | null = null;

    constructor(private readonly configService: ConfigService, private readonly logger: WinstonLoggerService) { }

    createBot(): Bot<BotContext> {
        if (this.bot) {
            return this.bot;
        }

        const token = this.configService.get<string>('BOT_TOKEN');
        if (!token) {
            this.logger.error('BOT_TOKEN is required', undefined, 'BotInstanceService');
            throw new Error('BOT_TOKEN is required');
        }

        this.logger.log('Initializing bot with token...', 'BotInstanceService');
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



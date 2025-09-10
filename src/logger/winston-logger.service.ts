import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LoggerConfigService } from '../config/logger-config.service';

@Injectable()
export class WinstonLoggerService implements LoggerService {
    private readonly logger: winston.Logger;

    constructor(private readonly configService: LoggerConfigService) {
        this.configService.ensureLogDirectory();
        const config = this.configService.createLoggerConfig();

        this.logger = winston.createLogger(config);

        const transportsArray = Array.isArray((config as any).transports)
            ? (config as any).transports
            : ((config as any).transports ? [(config as any).transports] : []);

        this.logger.info('Winston JSON Logger initialized', {
            level: config.level,
            transports: transportsArray.map((t: any) => t?.constructor?.name ?? 'unknown'),
            defaultMeta: config.defaultMeta,
        });
    }

    log(message: any, context?: string): void {
        this.logger.info(message, { context, source: 'NestJS' });
    }

    error(message: any, trace?: string, context?: string): void {
        this.logger.error(message, { context, trace, source: 'NestJS' });
    }

    warn(message: any, context?: string): void {
        this.logger.warn(message, { context, source: 'NestJS' });
    }

    debug(message: any, context?: string): void {
        this.logger.debug(message, { context, source: 'NestJS' });
    }

    verbose(message: any, context?: string): void {
        this.logger.silly(message, { context, source: 'NestJS' });
    }

    getWinstonLogger(): winston.Logger {
        return this.logger;
    }

    logWithMeta(level: string, message: string, meta: Record<string, any>): void {
        this.logger.log(level as any, message, { ...meta, source: 'Custom' });
    }

    logHttpRequest(
        method: string,
        url: string,
        statusCode: number,
        responseTime: number,
        userAgent?: string,
    ): void {
        this.logger.info('HTTP Request', {
            context: 'HTTP',
            source: 'HTTP',
            method,
            url,
            statusCode,
            responseTime,
            userAgent,
        });
    }

    logTelegramEvent(
        event: string,
        userId?: number,
        username?: string,
        chatId?: number,
        data?: Record<string, any>,
    ): void {
        this.logger.info('Telegram Event', {
            context: 'Telegram',
            source: 'Telegram',
            event,
            userId,
            username,
            chatId,
            ...data,
        });
    }

    logSetupAppEvent(
        operation: string,
        success: boolean,
        telegramId?: number,
        data?: Record<string, any>,
    ): void {
        const level = success ? 'info' : 'error';
        this.logger.log(level as any, 'Setup.app Operation', {
            context: 'SetupApp',
            source: 'SetupApp',
            operation,
            success,
            telegramId,
            ...data,
        });
    }
}



import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerConfigService {
    createLoggerConfig(): winston.LoggerOptions {
        const nodeEnv = process.env.NODE_ENV || 'development';
        const isProduction = nodeEnv === 'production';

        const logLevel = this.getRequiredLogLevel();

        const baseFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss.SSS',
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
        );

        const transports: any[] = [
            new winston.transports.Console({
                level: logLevel,
                format: baseFormat,
            }),
        ];

        if (isProduction && this.isLogDirectoryAvailable()) {
            transports.push(
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    format: baseFormat,
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    level: logLevel,
                    format: baseFormat,
                    maxsize: 5242880,
                    maxFiles: 5,
                }),
            );
        }

        return {
            level: logLevel,
            format: baseFormat,
            transports,
            defaultMeta: {
                service: 'setup-app-backoffice-bot',
                environment: nodeEnv,
                pid: process.pid,
            },
        };
    }

    private getRequiredLogLevel(): string {
        const logLevel = process.env.LOG_LEVEL;
        if (!logLevel) {
            throw new Error(
                'LOG_LEVEL environment variable is required. Valid values: error, warn, info, http, verbose, debug, silly',
            );
        }
        const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
        if (!validLevels.includes(logLevel)) {
            throw new Error(`Invalid LOG_LEVEL "${logLevel}". Valid values: ${validLevels.join(', ')}`);
        }
        return logLevel;
    }

    private isLogDirectoryAvailable(): boolean {
        const logDir = path.join(process.cwd(), 'logs');
        try {
            fs.accessSync(logDir, fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    ensureLogDirectory(): void {
        const logDir = path.join(process.cwd(), 'logs');
        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.warn(
                `Warning: Cannot create logs directory "${logDir}". File logging will be disabled. Error: ${error.message}`,
            );
            if (process.env.NODE_ENV === 'production') {
                // eslint-disable-next-line no-console
                console.warn(
                    'Production mode detected but file logging unavailable. Only console logging will be used.',
                );
            }
        }
    }
}



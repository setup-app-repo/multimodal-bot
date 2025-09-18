import { Controller, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { BotMainService } from './services';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly botOrchestrator: BotMainService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) { }

  @Post('webhook/:token')
  async handleWebhook(
    @Param('token') token: string,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Получен webhook, userId=${body?.message?.chat?.id ?? 'unknown'}` as any, 'TelegramController');

    try {
      const secretKey = this.configService.get<string>('TELEGRAM_SECRET_KEY');

      if (secretKey !== token) {
        res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid token' });
        return;
      }

      await this.botOrchestrator.handleWebhookUpdate(body);
      res.status(HttpStatus.OK).json({ ok: true });
    } catch (error) {
      this.logger.error('Ошибка обработки webhook:', error as any, 'TelegramController');
      throw error;
    }
  }
}

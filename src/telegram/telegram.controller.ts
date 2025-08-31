import { Controller, Post, Body, Logger, Param, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { BotService } from './services/bot.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly botService: BotService, private readonly configService: ConfigService) {}

  @Post('webhook/:token')
  async handleWebhook(@Param('token') token: string, @Body() update: any, @Res() res: Response): Promise<void> {
    this.logger.log('Получен webhook update от Telegram');
    
    try {
      const secretKey = this.configService.get<string>('TELEGRAM_SECRET_KEY');

      if (secretKey !== token) {
        res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid token' });
        return;
      }
      
      await this.botService.handleWebhookUpdate(update);
      res.status(HttpStatus.OK).json({ ok: true });
    } catch (error) {
      this.logger.error('Ошибка обработки webhook:', error);
      throw error;
    }
  }
}

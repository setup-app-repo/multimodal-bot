import { Controller, Post, Body, Logger } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    this.logger.log('Получен webhook update от Telegram');
    
    try {
      //TODO validate webhook
      await this.botService.handleWebhookUpdate(update);
      return { ok: true };
    } catch (error) {
      this.logger.error('Ошибка обработки webhook:', error);
      throw error;
    }
  }
}

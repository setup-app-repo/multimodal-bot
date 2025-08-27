import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { BotService } from './bot.service';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule as AppConfigModule } from 'src/config/config.module';
import { I18nModule } from 'src/i18n/i18n.module';
import { OpenRouterModule } from 'src/openrouter/openrouter.module';
import { SetupAppModule } from 'src/setup-app/setup-app.module';

@Module({
  imports: [RedisModule, AppConfigModule, I18nModule, OpenRouterModule, SetupAppModule],
  providers: [TelegramService, BotService],
  exports: [BotService]
})
export class TelegramModule {}

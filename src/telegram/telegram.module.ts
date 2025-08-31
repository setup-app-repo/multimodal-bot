import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { BotService } from './services/bot.service';
import { TelegramController } from './telegram.controller';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule as AppConfigModule } from 'src/config/config.module';
import { I18nModule } from 'src/i18n/i18n.module';
import { OpenRouterModule } from 'src/openrouter/openrouter.module';
import { SetupAppModule } from 'src/setup-app/setup-app.module';
import { UserModule } from 'src/user/user.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { TelegramFileService } from './services/telegram-file.service';
import { MessageHandlerService } from './services/message-handler.service';
import { DocumentHandlerService } from './services/document-handler.service';

@Module({
  imports: [RedisModule, AppConfigModule, I18nModule, OpenRouterModule, SetupAppModule, UserModule, SubscriptionModule],
  controllers: [TelegramController],
  providers: [TelegramService, BotService, TelegramFileService, MessageHandlerService, DocumentHandlerService],
  exports: [BotService]
})
export class TelegramModule {}

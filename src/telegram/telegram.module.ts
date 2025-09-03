import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { RedisModule } from 'src/redis/redis.module';
import { ConfigModule as AppConfigModule } from 'src/config/config.module';
import { I18nModule } from 'src/i18n/i18n.module';
import { OpenRouterModule } from 'src/openrouter/openrouter.module';
import { SetupAppModule } from 'src/setup-app/setup-app.module';
import { UserModule } from 'src/user/user.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import {
  BotService,
  MessageHandlerService,
  DocumentHandlerService,
  PhotoHandlerService,
  VoiceHandlerService,
  AudioConversionService,
  TelegramFileService,
  AccessControlService,
} from './services';
import { SubscriptionRenewalProcessor } from './processors/subscription-renewal.processor';

@Module({
  imports: [
    RedisModule,
    AppConfigModule,
    I18nModule,
    OpenRouterModule,
    SetupAppModule,
    UserModule,
    SubscriptionModule,
    BullModule.registerQueue({ name: 'subscription-renewal' }),
  ],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    BotService,
    TelegramFileService,
    MessageHandlerService,
    DocumentHandlerService,
    PhotoHandlerService,
    VoiceHandlerService,
    AudioConversionService,
    AccessControlService,
    SubscriptionRenewalProcessor,
  ],
  exports: [BotService]
})
export class TelegramModule {}

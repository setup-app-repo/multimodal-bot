import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule as AppConfigModule } from 'src/config/config.module';
import { I18nModule } from 'src/i18n/i18n.module';
import { OpenRouterModule } from 'src/openrouter/openrouter.module';
import { RedisModule } from 'src/redis/redis.module';
import { SetupAppModule } from 'src/setup-app/setup-app.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { UserModule } from 'src/user/user.module';

import { SubscriptionRenewalProcessor } from './processors/subscription-renewal.processor';
import {
  MessageHandlerService,
  DocumentHandlerService,
  PhotoHandlerService,
  VoiceHandlerService,
  AudioConversionService,
  TelegramFileService,
  AccessControlService,
} from './services';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { BotMainService, BotInstanceService, BotMiddlewareService, BotWebhookService, BotHandlerRegistrationService, BotMessagingService, RequestBufferService } from './services';

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
    BotMainService,
    BotInstanceService,
    BotMiddlewareService,
    BotWebhookService,
    BotHandlerRegistrationService,
    BotMessagingService,
    TelegramFileService,
    MessageHandlerService,
    DocumentHandlerService,
    PhotoHandlerService,
    VoiceHandlerService,
    AudioConversionService,
    AccessControlService,
    SubscriptionRenewalProcessor,
    RequestBufferService,
  ],
  exports: [BotMainService, BotMessagingService],
})
export class TelegramModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { I18nModule } from './i18n/i18n.module';
import { SetupAppModule } from './setup-app/setup-app.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TelegramModule,
    AppConfigModule,
    RedisModule,
    I18nModule,
    SetupAppModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

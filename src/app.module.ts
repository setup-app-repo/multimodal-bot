import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Redis } from 'ioredis';

import { createMikroOrmConfig } from '../mikro-orm.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { I18nModule } from './i18n/i18n.module';
import { NotificationModule } from './notification/notification.module';
import { RedisModule } from './redis/redis.module';
import { SetupAppModule } from './setup-app/setup-app.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TelegramModule } from './telegram/telegram.module';
import { UserModule } from './user/user.module';
import { UserLogsModule } from './user-logs/user-logs.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {

        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is required for BullMQ connection');
        }
        return {
          connection: new Redis(redisUrl, {
            maxRetriesPerRequest: null
          })
        };
      },
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createMikroOrmConfig(config),
    }),
    TelegramModule,
    AppConfigModule,
    RedisModule,
    I18nModule,
    SetupAppModule,
    UserModule,
    SubscriptionModule,
    NotificationModule,
    UserLogsModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

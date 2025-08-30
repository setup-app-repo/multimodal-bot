import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { I18nModule } from './i18n/i18n.module';
import { SetupAppModule } from './setup-app/setup-app.module';
import { UserModule } from './user/user.module';
import { createMikroOrmConfig } from '../mikro-orm.config';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

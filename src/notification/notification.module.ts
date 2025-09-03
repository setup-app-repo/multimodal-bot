import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { I18nModule } from 'src/i18n/i18n.module';
import { Subscription } from 'src/subscription/subscription.entity';
import { TelegramModule } from 'src/telegram/telegram.module';
import { User } from 'src/user/user.entity';

import { NotificationService } from './notification.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Subscription]), I18nModule, TelegramModule],
  providers: [NotificationService],
})
export class NotificationModule {}

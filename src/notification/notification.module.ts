import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { NotificationService } from './notification.service';
import { User } from 'src/user/user.entity';
import { I18nModule } from 'src/i18n/i18n.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [MikroOrmModule.forFeature([User]), I18nModule, TelegramModule],
  providers: [NotificationService],
})
export class NotificationModule {}



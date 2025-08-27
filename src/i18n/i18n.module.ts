import { Module } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [ConfigModule],
  providers: [I18nService, AppConfigService],
  exports: [I18nService],
})
export class I18nModule {}

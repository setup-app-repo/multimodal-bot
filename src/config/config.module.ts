import { Module } from '@nestjs/common';

import { AppConfigService } from './app-config.service';
import { LoggerConfigService } from './logger-config.service';

@Module({
  providers: [AppConfigService, LoggerConfigService],
  exports: [AppConfigService, LoggerConfigService],
})
export class ConfigModule { }

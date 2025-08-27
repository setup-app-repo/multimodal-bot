import { Module } from '@nestjs/common';
import { SetupAppService } from './setup-app.service';
import { SetupAppConfigService } from './setup-app-config.service';

@Module({
  providers: [SetupAppService, SetupAppConfigService],
  exports: [SetupAppService],
})
export class SetupAppModule {}

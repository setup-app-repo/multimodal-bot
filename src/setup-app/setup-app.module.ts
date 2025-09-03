import { Module } from '@nestjs/common';

import { SetupAppConfigService } from './setup-app-config.service';
import { SetupAppService } from './setup-app.service';

@Module({
  providers: [SetupAppService, SetupAppConfigService],
  exports: [SetupAppService],
})
export class SetupAppModule {}

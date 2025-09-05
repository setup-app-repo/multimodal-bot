import { Module } from '@nestjs/common';
import { UserLogsModule } from 'src/user-logs/user-logs.module';

import { SetupAppConfigService } from './setup-app-config.service';
import { SetupAppService } from './setup-app.service';

@Module({
  imports: [UserLogsModule],
  providers: [SetupAppService, SetupAppConfigService],
  exports: [SetupAppService],
})
export class SetupAppModule { }

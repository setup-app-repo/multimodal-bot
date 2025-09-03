import { Module } from '@nestjs/common';
import { ConfigModule as AppConfigModule } from 'src/config/config.module';

import { RedisService } from './redis.service';

@Module({
  imports: [AppConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

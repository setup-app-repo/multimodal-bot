import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SetupAppModule } from 'src/setup-app/setup-app.module';

import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Subscription]),
    SetupAppModule,
    BullModule.registerQueue({
      name: 'subscription-renewal',
    }),
  ],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

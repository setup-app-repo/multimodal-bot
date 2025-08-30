import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SetupAppModule } from 'src/setup-app/setup-app.module';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Subscription]), SetupAppModule],
  providers: [SubscriptionService],
  exports: [SubscriptionService]
})
export class SubscriptionModule {}

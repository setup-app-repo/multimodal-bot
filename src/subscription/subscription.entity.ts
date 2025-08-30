import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { User } from '../user/user.entity';

export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

@Entity()
export class Subscription {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User, { nullable: false, fieldName: 'telegram_id' })
  user!: User;

  @Property({ type: 'timestamptz' })
  periodStart: Date;

  @Property({ type: 'timestamptz' })
  periodEnd: Date;

  @Property({ type: 'boolean', default: true })
  autoRenew: boolean;

  @Property({ type: 'string', default: 'active' })
  status: SubscriptionStatus;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();
}

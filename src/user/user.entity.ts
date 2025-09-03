import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Cascade,
} from '@mikro-orm/core';

import { Subscription } from '../subscription/subscription.entity';

@Entity()
export class User {
  @PrimaryKey({ type: 'string' })
  telegramId!: string;

  @Property({ nullable: true })
  username?: string;

  @Property()
  firstName!: string;

  @Property({ nullable: true })
  lastName?: string;

  @Property({ nullable: true })
  languageCode?: string;

  @Property({ type: 'boolean' })
  isPremium: boolean = false;

  @Property({ type: 'json', nullable: true })
  settings?: Record<string, any>;

  @Property({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.user, {
    cascade: [Cascade.REMOVE],
  })
  subscriptions?: Subscription[];

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

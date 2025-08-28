import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
export class User {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  @Unique()
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

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

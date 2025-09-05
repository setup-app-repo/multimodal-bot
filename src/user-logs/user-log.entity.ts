import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user_logs' })
export class UserLog {
    @PrimaryKey({ type: 'bigint' })
    id!: string;

    @Property({ type: 'string' })
    telegramId!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'timestamptz' })
    createdAt: Date = new Date();
}

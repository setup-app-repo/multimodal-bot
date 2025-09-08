import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export enum EUserLogType {
    DEDUCT = 'deduct',
    REFUND = 'refund',
}

@Entity({ tableName: 'user_logs' })
export class UserLog {
    @PrimaryKey({ type: 'bigint' })
    id!: string;

    @Property({ type: 'string' })
    telegramId!: string;

    @Property({ type: 'string' })
    type!: EUserLogType;

    @Property({ columnType: 'numeric(12,2)' })
    amount!: number;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'timestamptz' })
    createdAt: Date = new Date();
}

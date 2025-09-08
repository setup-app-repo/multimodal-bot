import { Migration } from '@mikro-orm/migrations';

export class Migration20250908000000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "user_logs" add column if not exists "type" varchar(255) not null default 'deduct';`);
        this.addSql(`alter table "user_logs" add column if not exists "amount" numeric(12,2) not null default 0;`);
        this.addSql(`alter table "user_logs" alter column "amount" type numeric(12,2) using "amount"::numeric;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "user_logs" drop column if exists "type";`);
        this.addSql(`alter table "user_logs" drop column if exists "amount";`);
    }
}



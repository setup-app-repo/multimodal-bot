import { Migration } from '@mikro-orm/migrations';

export class Migration20250905000000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`create table "user_logs" ("id" bigserial primary key, "telegram_id" varchar(255) not null, "type" varchar(255) not null default 'deduct', "amount" int not null default 0, "description" text not null, "created_at" timestamptz not null);`);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "user_logs" cascade;`);
    }
}

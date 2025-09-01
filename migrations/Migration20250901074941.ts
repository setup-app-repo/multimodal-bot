import { Migration } from '@mikro-orm/migrations';

export class Migration20250901074941 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("telegram_id" varchar(255) not null, "username" varchar(255) null, "first_name" varchar(255) not null, "last_name" varchar(255) null, "language_code" varchar(255) null, "is_premium" boolean not null default false, "settings" jsonb null, "last_message_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("telegram_id"));`);

    this.addSql(`create table "subscription" ("id" bigserial primary key, "telegram_id" varchar(255) not null, "period_start" timestamptz not null, "period_end" timestamptz not null, "auto_renew" boolean not null default true, "status" varchar(255) not null default 'active', "created_at" timestamptz not null);`);

    this.addSql(`alter table "subscription" add constraint "subscription_telegram_id_foreign" foreign key ("telegram_id") references "user" ("telegram_id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "subscription" drop constraint "subscription_telegram_id_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "subscription" cascade;`);
  }

}

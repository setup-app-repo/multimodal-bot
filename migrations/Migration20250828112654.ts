import { Migration } from '@mikro-orm/migrations';

export class Migration20250828112654 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" serial, "telegram_id" varchar(255) not null, "username" varchar(255) null, "first_name" varchar(255) not null, "last_name" varchar(255) null, "language_code" varchar(255) null, "is_premium" boolean not null default false, "settings" jsonb null, "last_message_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_telegram_id_unique" unique ("telegram_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "user" cascade;`);
  }

}

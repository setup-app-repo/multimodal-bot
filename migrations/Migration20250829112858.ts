import { Migration } from '@mikro-orm/migrations';

export class Migration20250829112858 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "user" (
      "telegram_id" varchar(255) not null,
      "username" varchar(255) null,
      "first_name" varchar(255) not null,
      "last_name" varchar(255) null,
      "language_code" varchar(255) null,
      "is_premium" boolean not null default false,
      "settings" jsonb null,
      "last_message_at" timestamptz null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "user_pkey" primary key ("telegram_id")
    );`);

    // telegram_id уже является первичным ключом, уникальный индекс не требуется

    this.addSql(`create table if not exists "subscription" (
      "id" uuid not null,
      "telegram_id" varchar(255) not null,
      "period_start" timestamptz not null,
      "period_end" timestamptz not null,
      "auto_renew" boolean not null default true,
      "status" varchar(255) not null default 'active',
      "created_at" timestamptz not null,
      constraint "subscription_pkey" primary key ("id")
    );`);

    this.addSql(`do $$ begin
      if not exists (
        select 1
        from information_schema.table_constraints tc
        where tc.constraint_name = 'subscription_user_telegram_id_foreign'
      ) then
        alter table "subscription" add constraint "subscription_user_telegram_id_foreign" foreign key ("telegram_id") references "user" ("telegram_id") on update cascade;
      end if;
    end $$;`);
  }

  override async down(): Promise<void> {
    this.addSql(`do $$ begin
      if exists (
        select 1 from information_schema.table_constraints tc
        where tc.constraint_name = 'subscription_user_telegram_id_foreign'
      ) then
        alter table "subscription" drop constraint "subscription_user_telegram_id_foreign";
      end if;
    end $$;`);

    this.addSql(`drop table if exists "subscription" cascade;`);
    this.addSql(`drop table if exists "user" cascade;`);
  }

}

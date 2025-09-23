import { Migration } from '@mikro-orm/migrations';

export class Migration20250923000000 extends Migration {
    override async up(): Promise<void> {
        this.addSql('alter table "user" add column "blocked" boolean not null default false;');
    }

    override async down(): Promise<void> {
        this.addSql('alter table "user" drop column "blocked";');
    }
}



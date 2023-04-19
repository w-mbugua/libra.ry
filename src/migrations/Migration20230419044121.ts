import { Migration } from '@mikro-orm/migrations';

export class Migration20230419044121 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book" add column "thumbnail" varchar(255) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" drop column "thumbnail";');
  }

}

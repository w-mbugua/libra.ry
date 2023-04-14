import { Migration } from '@mikro-orm/migrations';

export class Migration20230414043624 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book" add column "subtitle" varchar(255) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" drop column "subtitle";');
  }

}

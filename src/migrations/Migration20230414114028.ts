import { Migration } from '@mikro-orm/migrations';

export class Migration20230414114028 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book" alter column "description" type text using ("description"::text);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" alter column "description" type varchar(255) using ("description"::varchar(255));');
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20230617041418 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "author" drop constraint "author_name_unique";');

    this.addSql('alter table "tag" drop constraint "tag_name_unique";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "author" add constraint "author_name_unique" unique ("name");');

    this.addSql('alter table "tag" add constraint "tag_name_unique" unique ("name");');
  }

}

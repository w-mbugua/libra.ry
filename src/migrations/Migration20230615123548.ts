import { Migration } from '@mikro-orm/migrations';

export class Migration20230615123548 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book" drop constraint "book_author_id_foreign";');

    this.addSql('alter table "book" add constraint "book_author_id_foreign" foreign key ("author_id") references "author" ("id") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" drop constraint "book_author_id_foreign";');

    this.addSql('alter table "book" add constraint "book_author_id_foreign" foreign key ("author_id") references "author" ("id") on update cascade;');
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20230320134742 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book_tags" drop constraint "book_tags_pkey";');
    this.addSql('alter table "book_tags" drop column "id";');
    this.addSql('alter table "book_tags" add constraint "book_tags_pkey" primary key ("book_id", "tag_id");');

    this.addSql('alter table "loan" drop column "name";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book_tags" add column "id" serial not null;');
    this.addSql('alter table "book_tags" drop constraint "book_tags_pkey";');
    this.addSql('alter table "book_tags" add constraint "book_tags_pkey" primary key ("id");');

    this.addSql('alter table "loan" add column "name" varchar(255) not null;');
  }

}

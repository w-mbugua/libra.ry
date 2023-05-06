import { Migration } from '@mikro-orm/migrations';

export class Migration20230505070931 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "book" drop constraint if exists "book_status_check";');

    this.addSql('alter table "book" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "book" add constraint "book_status_check" check ("status" in (\'available\', \'unavailable\', \'borrowed\', \'reserved\', \'lost\'));');
    this.addSql('create index "book_title_index" on "public"."book" using gin(to_tsvector(\'simple\', "title"));');

    this.addSql('alter table "loan" add column "status" text check ("status" in (\'pending\', \'approved\', \'cancelled\', \'overdue\', \'returned\')) not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" drop constraint if exists "book_status_check";');

    this.addSql('alter table "book" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "book" add constraint "book_status_check" check ("status" in (\'available\', \'unavailable\', \'borrowed\', \'reserved\', \'overdue\', \'lost\'));');
    this.addSql('drop index "book_title_index";');

    this.addSql('alter table "loan" drop column "status";');
  }

}

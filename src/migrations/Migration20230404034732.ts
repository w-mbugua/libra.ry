import { Migration } from '@mikro-orm/migrations';

export class Migration20230404034732 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "reservation" drop constraint if exists "reservation_status_check";');

    this.addSql('alter table "book" add column "status" text check ("status" in (\'available\', \'unavailable\', \'borrowed\', \'reserved\', \'overdue\', \'lost\')) not null;');

    this.addSql('alter table "reservation" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "reservation" add constraint "reservation_status_check" check ("status" in (\'pending\', \'fulfilled\', \'cancelled\'));');
  }

  async down(): Promise<void> {
    this.addSql('alter table "reservation" drop constraint if exists "reservation_status_check";');

    this.addSql('alter table "book" drop column "status";');

    this.addSql('alter table "reservation" alter column "status" type text using ("status"::text);');
    this.addSql('alter table "reservation" add constraint "reservation_status_check" check ("status" in (\'pendng\', \'fulfilled\', \'cancelled\'));');
  }

}

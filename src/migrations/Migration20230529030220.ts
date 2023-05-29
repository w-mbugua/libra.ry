import { Migration } from '@mikro-orm/migrations';

export class Migration20230529030220 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "member" add column "unread_messages" int null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "member" drop column "unread_messages";');
  }

}

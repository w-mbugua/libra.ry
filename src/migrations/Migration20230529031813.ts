import { Migration } from '@mikro-orm/migrations';

export class Migration20230529031813 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "member" alter column "unread_messages" type int using ("unread_messages"::int);');
    this.addSql('alter table "member" alter column "unread_messages" set default 0;');

    this.addSql('alter table "conversation_participant" add column "unread_messages" int null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "member" alter column "unread_messages" drop default;');
    this.addSql('alter table "member" alter column "unread_messages" type int using ("unread_messages"::int);');

    this.addSql('alter table "conversation_participant" drop column "unread_messages";');
  }

}

import { Migration } from '@mikro-orm/migrations';

export class Migration20230526121219 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "conversation" add column "latest_message_id" int null;');
    this.addSql('alter table "conversation" add constraint "conversation_latest_message_id_foreign" foreign key ("latest_message_id") references "message" ("id") on update cascade on delete set null;');
    this.addSql('alter table "conversation" drop column "latest_message";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "conversation" drop constraint "conversation_latest_message_id_foreign";');

    this.addSql('alter table "conversation" add column "latest_message" text null;');
    this.addSql('alter table "conversation" drop column "latest_message_id";');
  }

}

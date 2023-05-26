import { Migration } from '@mikro-orm/migrations';

export class Migration20230526063237 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "message" drop constraint "message_sender_id_unique";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "message" add constraint "message_sender_id_unique" unique ("sender_id");');
  }

}

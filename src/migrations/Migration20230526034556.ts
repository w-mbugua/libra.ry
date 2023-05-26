import { Migration } from '@mikro-orm/migrations';

export class Migration20230526034556 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "conversation_participant" drop constraint "conversation_participant_member_id_foreign";');

    this.addSql('alter table "conversation_participant" drop constraint "conversation_participant_member_id_unique";');
    this.addSql('alter table "conversation_participant" rename column "member_id" to "user_id";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "conversation_participant" rename column "user_id" to "member_id";');
    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_member_id_unique" unique ("member_id");');
  }

}

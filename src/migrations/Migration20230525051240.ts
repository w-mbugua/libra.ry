import { Migration } from '@mikro-orm/migrations';

export class Migration20230525051240 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "conversation" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "latest_message" text null);');

    this.addSql('create table "conversation_participant" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "member_id" int not null, "conversation_id" int not null, "has_seen_latest_message" boolean not null);');
    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_member_id_unique" unique ("member_id");');

    this.addSql('create table "message" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "body" text not null, "sender_id" int not null, "conversation_id" int not null);');
    this.addSql('alter table "message" add constraint "message_sender_id_unique" unique ("sender_id");');

    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_member_id_foreign" foreign key ("member_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');

    this.addSql('alter table "message" add constraint "message_sender_id_foreign" foreign key ("sender_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "conversation_participant" drop constraint "conversation_participant_conversation_id_foreign";');

    this.addSql('alter table "message" drop constraint "message_conversation_id_foreign";');

    this.addSql('drop table if exists "conversation" cascade;');

    this.addSql('drop table if exists "conversation_participant" cascade;');

    this.addSql('drop table if exists "message" cascade;');
  }

}

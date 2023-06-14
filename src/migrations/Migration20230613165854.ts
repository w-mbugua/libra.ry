import { Migration } from '@mikro-orm/migrations';

export class Migration20230613165854 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "author" ("id" serial primary key, "name" varchar(255) not null);');

    this.addSql('create table "member" ("id" serial primary key, "username" varchar(255) not null, "email" varchar(255) not null, "phone_number" varchar(255) not null, "unread_messages" int null default 0, "password" varchar(255) not null);');

    this.addSql('create table "book" ("id" serial primary key, "title" varchar(255) not null, "description" text not null, "subtitle" varchar(255) null, "cover" varchar(255) not null, "thumbnail" varchar(255) null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "author_id" int not null, "owner_id" int not null, "status" text check ("status" in (\'available\', \'unavailable\', \'borrowed\', \'reserved\', \'lost\')) not null);');
    this.addSql('create index "book_title_index" on "public"."book" using gin(to_tsvector(\'simple\', "title"));');

    this.addSql('create table "loan" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "return_date" timestamptz(0) not null, "book_id" int not null, "borrower_id" int not null, "lender_id" int not null, "status" text check ("status" in (\'pending\', \'approved\', \'cancelled\', \'overdue\', \'returned\')) not null);');

    this.addSql('create table "conversation" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "latest_message_id" int null);');

    this.addSql('create table "message" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "body" text not null, "sender_id" int not null, "conversation_id" int not null);');

    this.addSql('create table "conversation_participant" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "user_id" int not null, "conversation_id" int not null, "has_seen_latest_message" boolean not null, "unread_messages" int null);');

    this.addSql('create table "reservation" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "book_id" int not null, "reserver_id" int not null, "lender_id" int not null, "status" text check ("status" in (\'pending\', \'fulfilled\', \'cancelled\')) not null);');

    this.addSql('create table "review" ("id" serial primary key, "review" varchar(255) not null);');

    this.addSql('create table "tag" ("id" serial primary key, "name" varchar(255) not null);');

    this.addSql('create table "book_tags" ("book_id" int not null, "tag_id" int not null, constraint "book_tags_pkey" primary key ("book_id", "tag_id"));');

    this.addSql('alter table "book" add constraint "book_author_id_foreign" foreign key ("author_id") references "author" ("id") on update cascade;');
    this.addSql('alter table "book" add constraint "book_owner_id_foreign" foreign key ("owner_id") references "member" ("id") on update cascade;');

    this.addSql('alter table "loan" add constraint "loan_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade;');
    this.addSql('alter table "loan" add constraint "loan_borrower_id_foreign" foreign key ("borrower_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "loan" add constraint "loan_lender_id_foreign" foreign key ("lender_id") references "member" ("id") on update cascade;');

    this.addSql('alter table "conversation" add constraint "conversation_latest_message_id_foreign" foreign key ("latest_message_id") references "message" ("id") on update cascade on delete set null;');

    this.addSql('alter table "message" add constraint "message_sender_id_foreign" foreign key ("sender_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');

    this.addSql('alter table "conversation_participant" add constraint "conversation_participant_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');

    this.addSql('alter table "reservation" add constraint "reservation_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade;');
    this.addSql('alter table "reservation" add constraint "reservation_reserver_id_foreign" foreign key ("reserver_id") references "member" ("id") on update cascade;');
    this.addSql('alter table "reservation" add constraint "reservation_lender_id_foreign" foreign key ("lender_id") references "member" ("id") on update cascade;');

    this.addSql('alter table "book_tags" add constraint "book_tags_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "book_tags" add constraint "book_tags_tag_id_foreign" foreign key ("tag_id") references "tag" ("id") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book" drop constraint "book_author_id_foreign";');

    this.addSql('alter table "book" drop constraint "book_owner_id_foreign";');

    this.addSql('alter table "loan" drop constraint "loan_borrower_id_foreign";');

    this.addSql('alter table "loan" drop constraint "loan_lender_id_foreign";');

    this.addSql('alter table "message" drop constraint "message_sender_id_foreign";');

    this.addSql('alter table "reservation" drop constraint "reservation_reserver_id_foreign";');

    this.addSql('alter table "reservation" drop constraint "reservation_lender_id_foreign";');

    this.addSql('alter table "loan" drop constraint "loan_book_id_foreign";');

    this.addSql('alter table "reservation" drop constraint "reservation_book_id_foreign";');

    this.addSql('alter table "book_tags" drop constraint "book_tags_book_id_foreign";');

    this.addSql('alter table "message" drop constraint "message_conversation_id_foreign";');

    this.addSql('alter table "conversation_participant" drop constraint "conversation_participant_conversation_id_foreign";');

    this.addSql('alter table "conversation" drop constraint "conversation_latest_message_id_foreign";');

    this.addSql('alter table "book_tags" drop constraint "book_tags_tag_id_foreign";');

    this.addSql('drop table if exists "author" cascade;');

    this.addSql('drop table if exists "member" cascade;');

    this.addSql('drop table if exists "book" cascade;');

    this.addSql('drop table if exists "loan" cascade;');

    this.addSql('drop table if exists "conversation" cascade;');

    this.addSql('drop table if exists "message" cascade;');

    this.addSql('drop table if exists "conversation_participant" cascade;');

    this.addSql('drop table if exists "reservation" cascade;');

    this.addSql('drop table if exists "review" cascade;');

    this.addSql('drop table if exists "tag" cascade;');

    this.addSql('drop table if exists "book_tags" cascade;');
  }

}

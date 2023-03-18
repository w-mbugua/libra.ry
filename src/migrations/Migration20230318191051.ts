import { Migration } from '@mikro-orm/migrations';

export class Migration20230318191051 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "review" ("id" serial primary key, "review" varchar(255) not null);');

    this.addSql('create table "tag" ("id" serial primary key, "name" varchar(255) not null);');

    this.addSql('create table "book_tags" ("id" serial primary key, "book_id" int not null, "tag_id" int not null);');

    this.addSql('create table "reservation" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "book_id" int not null, "reserver_id" int not null, "status" text check ("status" in (\'pendng\', \'fulfilled\', \'cancelled\')) not null);');

    this.addSql('create table "loan" ("id" serial primary key, "name" varchar(255) not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "return_date" timestamptz(0) not null, "book_id" int not null, "borrower_id" int not null);');

    this.addSql('alter table "book_tags" add constraint "book_tags_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "book_tags" add constraint "book_tags_tag_id_foreign" foreign key ("tag_id") references "tag" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "reservation" add constraint "reservation_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade;');
    this.addSql('alter table "reservation" add constraint "reservation_reserver_id_foreign" foreign key ("reserver_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "loan" add constraint "loan_book_id_foreign" foreign key ("book_id") references "book" ("id") on update cascade;');
    this.addSql('alter table "loan" add constraint "loan_borrower_id_foreign" foreign key ("borrower_id") references "user" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "book_tags" drop constraint "book_tags_tag_id_foreign";');

    this.addSql('drop table if exists "review" cascade;');

    this.addSql('drop table if exists "tag" cascade;');

    this.addSql('drop table if exists "book_tags" cascade;');

    this.addSql('drop table if exists "reservation" cascade;');

    this.addSql('drop table if exists "loan" cascade;');
  }

}

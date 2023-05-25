import {
  Collection,
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Author } from './Author';
import { Loan } from './Loan';
import { Reservation } from './Reservation';
import { Tag } from './Tag';
import { Member } from './Member';

@ObjectType()
@Entity()
export class Book {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => String)
  @Index({ type: 'fulltext' })
  @Property()
  title!: string;

  @Field(() => String)
  @Property({ type: 'text' })
  description: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  subtitle?: string;

  @Field(() => String)
  @Property()
  cover: string;

  @Field(() => String, { nullable: true })
  @Property({ nullable: true })
  thumbnail?: string;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field(() => [Tag])
  @ManyToMany({ entity: () => Tag, inversedBy: 'books' })
  tags = new Collection<Tag>(this);

  @Field(() => Author)
  @ManyToOne(() => Author)
  author!: Author;

  @Field(() => Member)
  @ManyToOne(() => Member)
  owner!: Member;

  @Field(() => [Reservation])
  @OneToMany(() => Reservation, (r: Reservation) => r.book, {
    orphanRemoval: true,
  })
  reservations = new Collection<Reservation>(this);

  @Field(() => [Loan])
  @OneToMany(() => Loan, (loan: Loan) => loan.book, { orphanRemoval: true })
  loans = new Collection<Loan>(this);

  @Field({ nullable: true })
  @Enum(() => BookStatus)
  status?: BookStatus;
}

export enum BookStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  BORROWED = 'borrowed',
  RESERVED = 'reserved',
  LOST = 'lost',
}

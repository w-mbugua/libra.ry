import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';
import { Member } from './Member';

@ObjectType()
@Entity()
export class Loan {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field()
  @Property()
  returnDate: Date = new Date();

  @Field(() => Book)
  @ManyToOne(() => Book)
  book!: Book;

  @Field(() => Member)
  @ManyToOne(() => Member)
  borrower!: Member;

  @Field(() => Member)
  @ManyToOne(() => Member)
  lender: Member;

  @Field({ nullable: true })
  @Enum(() => LoanStatus)
  status?: LoanStatus;
}

export enum LoanStatus {
  PENDING = 'pending', // The owner has accepted the request and the book is waiting to be picked up by the borrower. or the owner is yet to approve
  APPROVED = 'approved',
  CANCELLED = 'cancelled', // by either of the party
  OVERDUE = 'overdue',
  RETURNED = 'returned',
}

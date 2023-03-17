import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';
import { User } from './User';

@ObjectType()
@Entity()
export class Loan {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property({ hidden: true })
  name!: string;

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

  @Field(() => User)
  @ManyToOne(() => User)
  borrower!: User;
}

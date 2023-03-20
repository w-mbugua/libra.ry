import {
  Collection,
  Entity,
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
import { User } from './User';

@ObjectType()
@Entity()
export class Book {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => String)
  @Property()
  title!: string;

  @Field(() => [Tag])
  @ManyToMany({ entity: () => Tag, inversedBy: 'books' })
  tags = new Collection<Tag>(this);

  @Field(() => Author)
  @ManyToOne(() => Author)
  author!: Author;

  @Field(() => User)
  @ManyToOne(() => User)
  owner!: User;

  @Field(() => [Reservation])
  @OneToMany(() => Reservation, (r: Reservation) => r.book)
  reservations = new Collection<Reservation>(this);

  @Field(() => [Loan])
  @OneToMany(() => Loan, (loan: Loan) => loan.book)
  loans = new Collection<Loan>(this);
}

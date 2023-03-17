import {
  Entity,
  Enum,
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
export class Reservation {
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
  @ManyToOne(() => Book)
  book!: Book;

  @Field(() => User)
  @ManyToOne(() => User)
  reserver!: User;

  @Field()
  @Enum(() => ReservationStatus)
  status!: ReservationStatus;
}

export const enum ReservationStatus {
  PENDING = 'pendng',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

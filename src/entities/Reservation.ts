import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';
import { Member } from './Member';

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

  @Field(() => Book)
  @ManyToOne(() => Book)
  book!: Book;

  @Field(() => Member)
  @ManyToOne(() => Member)
  reserver!: Member;

  @Field()
  @Enum(() => ReservationStatus)
  status!: ReservationStatus;
}

export enum ReservationStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

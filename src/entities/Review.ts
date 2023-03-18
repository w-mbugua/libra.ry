import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';


@ObjectType()
@Entity()
export class Review {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property()
  review: string;
}

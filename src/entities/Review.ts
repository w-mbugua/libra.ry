import { Entity, PrimaryKey } from '@mikro-orm/core';
import { Field } from 'type-graphql';

@Entity()
export class Review {
  @Field()
  @PrimaryKey()
  id: number;
}

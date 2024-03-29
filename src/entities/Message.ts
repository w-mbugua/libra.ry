import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Member } from './Member';
import { Conversation } from './Conversation';

@ObjectType()
@Entity()
export class Message {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property()
  createdAt: Date = new Date();

  @Field()
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Field(() => String)
  @Property({ type: 'text' })
  body: string;

  @Field(() => Member)
  @ManyToOne(() => Member)
  sender: Member;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation)
  conversation: Conversation;
}

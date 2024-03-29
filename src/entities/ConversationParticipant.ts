import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Conversation } from './Conversation';

@ObjectType()
@Entity()
export class ConversationParticipant {
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
  userId: number;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation)
  conversation: Conversation;

  @Field()
  @Property()
  hasSeenLatestMessage: boolean;

  @Field({ nullable: true })
  @Property({ nullable: true })
  unreadMessages?: number;
}

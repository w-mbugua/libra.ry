import { Entity, Property, PrimaryKey, ManyToOne, OneToOne } from '@mikro-orm/core';
import { Field } from 'type-graphql';
import { Member } from './Member';
import { Conversation } from './Conversation';

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

  @Field(() => Member)
  @OneToOne(() => Member)
  member: Member;

  @Field(()=> Conversation)
  @ManyToOne(()=> Conversation)
  conversation: Conversation

  @Field()
  @Property()
  hasSeenLatestMessage: boolean
}

import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  OneToOne,
} from '@mikro-orm/core';
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
  @OneToOne(() => Member, { mapToPk: true })
  member: Member;

  @Field(() => Conversation)
  @ManyToOne(() => Conversation, { mapToPk: true})
  conversation: Conversation;

  @Field()
  @Property()
  hasSeenLatestMessage: boolean;
}

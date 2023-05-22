import {
  Entity,
  Property,
  PrimaryKey,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Field } from 'type-graphql';
import { Message } from './Message';
import { ConversationParticipant } from './ConversationParticipant';

@Entity()
export class Conversation {
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
  latestMessage: string;

  @Field()
  @OneToMany(() => Message, (msg) => msg.conversation)
  messages = new Collection<Message>(this);

  @Field()
  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation
  )
  participants = new Collection<ConversationParticipant>(this);
}

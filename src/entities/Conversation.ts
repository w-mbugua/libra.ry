import {
  Entity,
  Property,
  PrimaryKey,
  OneToMany,
  Collection,
  ManyToOne,
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Message } from './Message';
import { ConversationParticipant } from './ConversationParticipant';

@ObjectType()
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

  // @Field(() => String, { nullable: true })
  // @Property({ type: 'text', nullable: true })
  // latestMessage?: string;

  @Field(() => [Message])
  @OneToMany(() => Message, (msg) => msg.conversation, { orphanRemoval: true })
  messages = new Collection<Message>(this);

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, { nullable: true })
  latestMessage?: Message;

  @Field(() => [ConversationParticipant])
  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation,
    { orphanRemoval: true }
  )
  participants = new Collection<ConversationParticipant>(this);
}

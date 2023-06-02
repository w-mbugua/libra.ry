import { GraphQLError } from 'graphql';
import { Conversation } from '../entities/Conversation';
import { Member } from '../entities/Member';
import { Message } from '../entities/Message';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  PubSub,
  Query,
  Resolver,
  Root,
  Subscription,
  UseMiddleware,
} from 'type-graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import {
  CONVERSATION_UPDATED,
  MESSAGE_SENT,
  NOTIFICATION,
} from '../utils/events';
import { ConversationParticipant } from '../entities/ConversationParticipant';

@InputType()
class MessageInput {
  @Field()
  body: string;

  @Field()
  conversationId: number;

  @Field()
  sender: number;
}

@Resolver()
export class MessageResolver {
  @Query(() => [Message])
  @UseMiddleware(isAuth)
  async messages(
    @Arg('conversationId') conversationId: number,
    @Ctx() { em }: MyContext
  ): Promise<Message[]> {
    try {
      const messages = await em.find(
        Message,
        { conversation: conversationId },
        { populate: true, orderBy: { createdAt: 'DESC' } }
      );
      return messages;
    } catch (err: any) {
      console.log("Couldn't fetch messages");
      throw new GraphQLError('Error fetching messages ' + err.message);
    }
  }
  @Mutation(() => Message)
  @UseMiddleware(isAuth)
  async sendMessage(
    @Arg('messageData') messageData: MessageInput,
    @Ctx() { req, em }: MyContext,
    @PubSub() pubsub: RedisPubSub
  ): Promise<Message> {
    const {
      session: { userId },
    } = req;

    const { body, sender, conversationId } = messageData;

    if (!userId || sender !== userId) {
      throw new GraphQLError('Not authorized!');
    }

    try {
      const conversationExists = await em.findOneOrFail(
        Conversation,
        {
          id: conversationId,
        },
        {
          populate: ['participants', 'latestMessage'],
        }
      );
      // should always exist
      if (!conversationExists) {
        throw new GraphQLError('Conversation not found');
      }
      const newMsg = em.create(Message, {
        body,
        sender,
        createdAt: '',
        updatedAt: '',
        conversation: conversationExists.id,
      });

      conversationExists.latestMessage = newMsg;
      await em.persistAndFlush(newMsg);

      const senderDetails = await em.findOne(Member, { id: sender });

      const msgToPublish = {
        ...newMsg,
        sender: { id: senderDetails?.id, username: senderDetails?.username },
      };
      pubsub.publish(MESSAGE_SENT, {
        messageSent: msgToPublish,
      });

      pubsub.publish(CONVERSATION_UPDATED, {
        conversation: { ...conversationExists, latestMessage: msgToPublish },
      });

      const participants = await em.find(ConversationParticipant, {
        conversation: conversationExists.id,
      });
      let otherParticipants: number[] = []; // for now it's only one item
      participants.forEach((p) => {
        if (p.userId === sender) {
          p.hasSeenLatestMessage = true;
        } else {
          otherParticipants = [p.userId, ...otherParticipants];
          p.hasSeenLatestMessage = false;
        }
      });
      await em.persistAndFlush([...participants]);

      // update unread msg count for non-senders
      const memberDetails = await em.findOneOrFail(Member, {
        id: otherParticipants[0],
      });
      if (memberDetails) {
        memberDetails.unreadMessages = memberDetails.unreadMessages
          ? (memberDetails.unreadMessages += 1)
          : 1;

        pubsub.publish(NOTIFICATION, { user: { ...memberDetails } });
      }

      await em.persistAndFlush(conversationExists);
      await em.persistAndFlush(memberDetails);

      return newMsg;
    } catch (err: any) {
      console.log('CREATE MSG ERROR', err);
      throw new GraphQLError(err?.message);
    }
  }

  @Mutation(() => Member)
  async markNotificationsAsRead(
    @Ctx() { req, em }: MyContext
  ): Promise<Member> {
    const { userId } = req.session;
    if (!userId) {
      throw new GraphQLError('Not authorized!');
    }
    try {
      const user = await em.findOneOrFail(Member, { id: userId });
      user.unreadMessages = 0;
      await em.persistAndFlush(user);
      return user;
    } catch (err) {
      throw new GraphQLError(err);
    }
  }

  @Mutation(() => Conversation)
  async markConversationAsRead(
    @Arg('conversationId') conversationId: number,
    @Ctx() { req, em }: MyContext
  ) {
    const {
      session: { userId },
    } = req;
    try {
      const conversation = await em.findOneOrFail(
        Conversation,
        {
          id: conversationId,
        },
        { populate: ['participants'] }
      );
      const activeParticipant = await em.findOneOrFail(
        ConversationParticipant,
        { conversation: conversationId, userId }
      );
      activeParticipant.hasSeenLatestMessage = true;
      await em.persistAndFlush(activeParticipant);
      return conversation;
    } catch (err: any) {
      console.log("Couldn't fetch messages");
      throw new GraphQLError('Error fetching messages ' + err.message);
    }
  }

  @Subscription({
    topics: MESSAGE_SENT,
    filter: ({ payload, args }) =>
      payload.messageSent.conversation.id === args.conversationId,
  })
  messageSent(
    @Root() messageSentPayload: { messageSent: Message },
    @Arg('conversationId') conversationId: number
  ): Message {
    return {
      ...messageSentPayload.messageSent,
      createdAt: new Date(messageSentPayload.messageSent.createdAt),
      updatedAt: new Date(messageSentPayload.messageSent.updatedAt),
    };
  }

  @Subscription({
    topics: NOTIFICATION,
    filter: ({ payload, args }) => payload.user.id === args.userId,
  })
  newNotification(
    @Root() notificationPayload: { user: Member },
    @Arg('userId') userId: number
  ): Member {
    return notificationPayload.user;
  }

  @Subscription({
    topics: CONVERSATION_UPDATED,
    filter: ({ payload, args }) =>
      payload.conversation.id === args.conversationId,
  })
  updatedConversation(
    @Root() updatedConversationPayload: { conversation: Conversation },
    @Arg('conversationId') conversationId: number
  ): Conversation {
    const newConversation = updatedConversationPayload.conversation;

    return {
      ...newConversation,
      createdAt: new Date(newConversation.createdAt),
      updatedAt: new Date(newConversation.updatedAt),
      latestMessage: newConversation.latestMessage
        ? {
            ...newConversation.latestMessage,
            createdAt: new Date(newConversation.latestMessage.createdAt || ''),
            updatedAt: new Date(newConversation.latestMessage.updatedAt || ''),
          }
        : undefined,
    };
  }
}

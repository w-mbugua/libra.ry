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
import { MESSAGE_SENT, NOTIFICATION } from '../utils/events';

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
        { populate: ['participants'] }
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
      await em.persistAndFlush(conversationExists);

      const senderDetails = await em.findOne(Member, { id: sender });

      await pubsub.publish(MESSAGE_SENT, {
        messageSent: {
          ...newMsg,
          sender: { id: senderDetails?.id, username: senderDetails?.username },
        },
      });

      const otherParticipant = conversationExists.participants
        .toArray()
        .map((p) => p.userId)
        .filter((id) => id !== userId)[0];

      // update unread msg count for non-senders
      const memberDetails = await em.findOneOrFail(Member, {
        id: otherParticipant,
      });
      if (memberDetails) {
        memberDetails.unreadMessages = memberDetails.unreadMessages
          ? (memberDetails.unreadMessages += 1)
          : 1;
        console.log({ memberDetails });

        pubsub.publish(NOTIFICATION, { user: { ...memberDetails } });
      }
      await em.persistAndFlush(memberDetails);

      return newMsg;
    } catch (err: any) {
      console.log('CREATE MSG ERROR', err);
      throw new GraphQLError(err?.message);
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
    console.log('SUBSCRIPTION', messageSentPayload);

    return {
      ...messageSentPayload.messageSent,
      createdAt: new Date(messageSentPayload.messageSent.createdAt),
      updatedAt: new Date(messageSentPayload.messageSent.updatedAt),
    };
  }

  @Subscription({
    topics: NOTIFICATION,
    filter: ({ payload, args }) => {
      console.log('USER', payload.user.id, args.userId);
      console.log('USERNAME', payload.user.username);

      return payload.user.id === args.userId;
    },
  })
  newNotification(
    @Root() notificationPayload: { user: Member },
    @Arg('userId') userId: number
  ): Member {
    console.log('NOTIFICATION!!', notificationPayload.user.username);

    return notificationPayload.user;
  }
}

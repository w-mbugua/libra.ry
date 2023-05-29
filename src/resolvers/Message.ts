import { GraphQLError } from 'graphql';
import { Conversation } from '../entities/Conversation';
import { Member } from '../entities/Member';
import { Message } from '../entities/Message';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import {
  Arg,
  Args,
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
import { withFilter } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';

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
        { populate: true, orderBy: {createdAt: 'DESC'} }
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
  ) {
    const {
      session: { userId },
    } = req;

    const { body, sender, conversationId } = messageData;

    if (!userId || sender !== userId) {
      throw new GraphQLError('Not authorized!');
    }

    try {
      const conversationExists = await em.findOneOrFail(Conversation, {
        id: conversationId,
      });
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
      await pubsub.publish('MESSAGE_SENT', {
        messageSent: {
          ...newMsg,
          sender: { id: senderDetails?.id, username: senderDetails?.username },
        },
      });
      // publish event
      return newMsg;
    } catch (err: any) {
      console.log('CREATE MSG ERROR', err);
      throw new GraphQLError(err?.message);
    }
  }

  @Subscription({
    topics: 'MESSAGE_SENT',
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
}

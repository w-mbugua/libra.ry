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
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';

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
        { populate: true }
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
    @Ctx() { req, em }: MyContext
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

      await em.persistAndFlush(newMsg);
      conversationExists.latestMessage = newMsg;
      await em.persistAndFlush(conversationExists);

      // publish event
      return newMsg;
    } catch (err: any) {
      console.log('CREATE MSG ERROR', err);
      throw new GraphQLError(err?.message);
    }
  }
}

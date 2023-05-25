import { GraphQLError } from 'graphql';
import { Conversation } from '../entities/Conversation';
import { ConversationParticipant } from '../entities/ConversationParticipant';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  UseMiddleware,
} from 'type-graphql';

@ObjectType()
class ConversationResponse {
  @Field({ nullable: true })
  conversation?: Conversation;

  @Field({ nullable: true })
  error?: String;
}

@InputType()
class conversationsInput {
  @Field(() => [Int])
  participantIds: number[];
}
export class ConversationResolver {
  @Query(() => [Conversation])
  @UseMiddleware(isAuth)
  async conversations(@Ctx() { req, em }: MyContext): Promise<Conversation[]> {
    const {
      session: { userId },
    } = req;
    if (!userId) {
      throw new GraphQLError('Not authorized');
    }
    // fetch conversations of a particular user
    const conversations = await em.find(
      Conversation,
      { participants: [userId] },
      { populate: true }
    );
    return conversations;
  }

  @Mutation(() => ConversationResponse)
  @UseMiddleware(isAuth)
  async createConversation(
    @Arg('createConversationData') createConversationData: conversationsInput,
    @Ctx() { req, em }: MyContext
  ): Promise<ConversationResponse> {
    const {
      session: { userId },
    } = req;

    if (!userId) {
      throw new GraphQLError('Not authorized!');
    }
    const { participantIds } = createConversationData;

    try {
      const conversations = await em.find(Conversation, {}, { populate: true });
      const conversationExists = conversations.find((c) =>
        c.participants
          .toArray()
          .map((p) => p.id)
          .every((val) => [...participantIds, userId].includes(val))
      );
      console.log({ conversationExists });

      if (conversationExists) {
        console.log('IT EXISTS');
        return { conversation: conversationExists };
      }
      const conversation = em.create(Conversation, {
        createdAt: '',
        updatedAt: '',
      });
      [userId, ...participantIds].forEach(async (id) => {
        const newParticipant = em.create(ConversationParticipant, {
          hasSeenLatestMessage: id === userId,
          createdAt: '',
          updatedAt: '',
          member: id,
          conversation: conversation,
        });
        await em.persistAndFlush(newParticipant);
        conversation.participants.add(newParticipant);
      });

      await em.persistAndFlush(conversation);
      return { conversation };
    } catch (err) {
      console.log('CREATE CONVERSATION ERROR: ', err);
      return {
        error: err?.message || 'Failed to create conversation',
      };
    }
  }
}

import { Conversation } from 'src/entities/Conversation';
import { ConversationParticipant } from 'src/entities/ConversationParticipant';
import { isAuth } from 'src/middleware/isAuth';
import { MyContext } from 'src/types';
import { Arg, Field, Mutation, ObjectType, UseMiddleware } from 'type-graphql';

@ObjectType()
class ConversationResponse {
  @Field()
  conversation?: Conversation;

  @Field()
  error?: String;
}
export class ConversationResolver {
  @Mutation()
  @UseMiddleware(isAuth)
  async createConversation(
    @Arg('participantIds') participantIds: Array<number>,
    { req, em }: MyContext
  ): Promise<ConversationResponse> {
    const {
      session: { userId },
    } = req;

    try {
      const conversation = em.create(Conversation, {
        createdAt: '',
        updatedAt: '',
      });
      participantIds.forEach(async (id) => {
        const newParticipant = em.create(ConversationParticipant, {
          hasSeenLatestMessage: id === userId,
          createdAt: '',
          updatedAt: '',
          member: id,
          conversation,
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

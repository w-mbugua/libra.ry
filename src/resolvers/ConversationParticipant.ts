import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { MyContext } from '../types';
import { ConversationParticipant } from '../entities/ConversationParticipant';

@Resolver()
export class ConversationParticipantResolver {
  @Query(() => [ConversationParticipant])
  async getTags(
    @Arg('conversationId') conversationId: number,
    @Ctx() { em }: MyContext
  ): Promise<ConversationParticipant[]> {
    const participants = await em.find(
      ConversationParticipant,
      {conversation: conversationId},
      { populate: true }
    );
    return participants;
  }
}

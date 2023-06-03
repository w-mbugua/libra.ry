import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Author } from '../entities/Author';
import { Tag } from '../entities/Tag';
import { MyContext } from '../types';

@Resolver()
export class TagResolver {
  @Mutation(() => Author)
  async addTag(
    @Arg('name') name: string,
    @Ctx() { em }: MyContext
  ): Promise<Author> {
    const newTag = em.create(Tag, { name });
    await em.persistAndFlush(newTag);
    return newTag;
  }

  @Query(() => [Tag])
  async getTags(@Ctx() { em }: MyContext): Promise<Author[]> {
    const allTags = await em.find(Tag, {}, { populate: true });
    return allTags;
  }
}

import { Author } from '../entities/Author';
import { MyContext } from 'src/types';
import { Arg, Ctx, Field, InputType, Mutation, Query, Resolver } from 'type-graphql';

@InputType()
class NewAuthorInput {
  @Field(() => String)
  name!: string;
}
@Resolver()
export class AuthorResolver {
  @Mutation(() => Author)
  async addAuthor(
    @Arg('newAuthorData') newAuthorData: NewAuthorInput,
    @Ctx() { em }: MyContext
  ): Promise<Author> {
    const newAuthor = em.create(Author, { ...newAuthorData });
    await em.persistAndFlush(newAuthor);
    return newAuthor;
  }

  @Query(() => [Author])
  async getAuthors(@Ctx() { em }: MyContext): Promise<Author[]> {
    const allAuthors = await em.find(Author, {});
	return allAuthors
  }
}

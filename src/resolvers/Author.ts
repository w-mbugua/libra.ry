import { Author } from '../entities/Author';
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
import { isAuth } from '../middleware/isAuth';

@InputType()
class NewAuthorInput {
  @Field(() => String)
  name!: string;
}
@Resolver()
export class AuthorResolver {
  @Mutation(() => Author)
  @UseMiddleware(isAuth)
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
    const allAuthors = await em.find(Author, {}, { populate: true });
    return allAuthors;
  }
}

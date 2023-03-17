import { Book } from '../entities/Book';
import { MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { Author } from '../entities/Author';
import { Tag } from 'src/entities/Tag';

@InputType()
class NewBookInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  author!: string;

  @Field(() => String)
  tag: string;
}

@Resolver()
export class BookResolver {
  @Mutation(() => Book)
  async addBook(
    @Arg('newBookData') newBookData: NewBookInput,
    @Ctx() { em }: MyContext
  ): Promise<Book> {
    const { author, title } = newBookData;
    // create author
    const newAuthor = em.create(Author, { name: author });
    const newBook = em.create(Book, { title, author: newAuthor });
    if (newBookData.tag) {
      const newTag = em.create(Tag, { name: newBookData.tag });
      await em.persistAndFlush(newTag);
    }
    await em.persistAndFlush(newAuthor);
    await em.persistAndFlush(newBook);
    return newBook;
  }

  @Query(() => [Book])
  async getBooks(@Ctx() { em }: MyContext): Promise<Book[]> {
    const allBooks = await em.find(Book, {}, { populate: true });
    console.log('ALL BOOKS', allBooks);

    return allBooks;
  }
}

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
  UseMiddleware,
} from 'type-graphql';
import { Author } from '../entities/Author';
import { Tag } from '../entities/Tag';
import { isAuth } from '../middleware/isAuth';
import { Member } from '../entities/Member';

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
  @UseMiddleware(isAuth)
  async addBook(
    @Arg('newBookData') newBookData: NewBookInput,
    @Ctx() { em, req }: MyContext
  ): Promise<Book> {
    const { author, title } = newBookData;
    // create author
    const newAuthor = em.create(Author, { name: author });
    const member = await em.findOneOrFail(Member, { id: req.session.userId });
    const newBook = em.create(Book, {
      title,
      author: newAuthor,
      owner: member,
    });
    newAuthor.books.add(newBook);
    if (newBookData.tag) {
      const newTag = em.create(Tag, { name: newBookData.tag });
      newBook.tags.add(newTag);
      newTag.books.add(newBook);
      await em.persistAndFlush(newTag);
    }
    await em.persistAndFlush(newAuthor);
    await em.persistAndFlush(newBook);
    return newBook;
  }

  @Query(() => [Book])
  async getBooks(@Ctx() { em }: MyContext): Promise<Book[]> {
    const allBooks = await em.find(Book, {}, { populate: true });
    return allBooks;
  }
}

import { Book } from '../entities/Book';
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
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Author } from '../entities/Author';
import { Tag } from '../entities/Tag';
import { isAuth } from '../middleware/isAuth';
import { Member } from '../entities/Member';
import { LOAN_PERIOD } from '../utils/constants';
import { Loan } from '../entities/Loan';

@InputType()
class NewBookInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  author!: string;

  @Field(() => String)
  tag: string;
}


@ObjectType()
class BookResponse {
  @Field({ nullable: true})
  book?: Book

  @Field({ nullable: true})
  message?: string
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

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async updateBook(
    @Arg('title', { nullable: true }) title: string,
    @Arg('newTitle', { nullable: true }) newTitle: string,
    @Ctx() { em, req }: MyContext
  ): Promise<Book> {
    const userId = req.session.userId;
    const owner = await em.findOneOrFail(Member, { id: userId });
    const book = await em.findOneOrFail(
      Book,
      { title: title, owner },
      { populate: true }
    );
  
    book.title = newTitle;
    await em.persistAndFlush(book);
    return book;
  }

  @Query(() => [Book])
  async getBooks(@Ctx() { em }: MyContext): Promise<Book[]> {
    const allBooks = await em.find(Book, {}, { populate: true });
    return allBooks;
  }

  @Query(() => Book)
  async getBookById(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<Book | String> {
    const book = await em.findOneOrFail(Book, { id }, { populate: true });
    return book;
  }

  @Mutation(() => Int)
  @UseMiddleware(isAuth)
  async deleteBook(
    @Arg('id') id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<number> {
    const userId = req.session.userId;
    const owner = await em.findOneOrFail(Member, { id: userId });
    await em.nativeDelete(Book, { id, owner });
    return 204;
  }

  @Mutation(() => BookResponse) // a loan is created when a user borrows a book
  @UseMiddleware(isAuth)
  async borrow(@Arg('id') id: number, @Ctx() ctx: MyContext): Promise<{book: Book |null, message: string}> {
    const userId = ctx.req.session.userId;
    const borrower = await ctx.em.findOneOrFail(Member, { id: userId });
    const book = await ctx.em.findOneOrFail(Book, { id }, { populate: true });
    const loans = book.loans;
    const reserves = book.reservations;
    await loans.init();
    await reserves.init();
    let message = '';

    
    if (loans.length || reserves.length) {
      console.log("T H E R E");
      message = 'this book has been borrowed.would you like to reserve it?';
    } else {
      console.log("H E R E");
      
      const returnDate = new Date().setDate(new Date().getDate() + LOAN_PERIOD);

      const newLoan = ctx.em.create(Loan, {
        borrower,
        book,
        createdAt: '',
        updatedAt: '',
        returnDate: new Date(returnDate),
      });
      book.loans.add(newLoan);
      await ctx.em.persistAndFlush(book);
      await ctx.em.persistAndFlush(newLoan);
      message = `The book is now yours for the next ${LOAN_PERIOD} days.Please remember to return it on time!`;
    }
    return {message, book};
  }
}

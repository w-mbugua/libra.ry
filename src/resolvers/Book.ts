import { Book, BookStatus } from '../entities/Book';
import { BookDetails, MyContext } from '../types';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Author } from '../entities/Author';
import { Tag } from '../entities/Tag';
import { isAuth } from '../middleware/isAuth';
import { Member } from '../entities/Member';
import { LOAN_PERIOD } from '../utils/constants';
import { Loan } from '../entities/Loan';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { searchBooksByTitle } from '../utils/getBook';

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
  @Field({ nullable: true })
  book?: Book;

  @Field({ nullable: true })
  message?: string;
}
@Resolver(Book)
export class BookResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Book) {
    return root.description.slice(0, 100);
  }

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
    const bookSearch = await searchBooksByTitle(title);
    const bookDetails: BookDetails = bookSearch[0] || {};
    console.log('BOOK DETAILS', bookDetails);

    const newBook = em.create(Book, {
      title,
      author: newAuthor,
      owner: member,
      status: BookStatus.AVAILABLE,
      createdAt: '',
      updatedAt: '',
      description: bookDetails.volumeInfo.description || '',
      subtitle: bookDetails.volumeInfo.subtitle || '',
      cover: bookDetails.volumeInfo.imageLinks.thumbnail || '',
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
  async borrow(
    @Arg('id') id: number,
    @Ctx() ctx: MyContext
  ): Promise<{ book: Book | null; message: string }> {
    const userId = ctx.req.session.userId;
    const borrower = await ctx.em.findOneOrFail(Member, { id: userId });
    const book = await ctx.em.findOneOrFail(Book, { id }, { populate: true });
    let message = '';

    if (book.status === 'borrowed') {
      message = 'this book has been borrowed.would you like to reserve it?';
    } else {
      const returnDate = new Date().setDate(new Date().getDate() + LOAN_PERIOD);
      const newLoan = ctx.em.create(Loan, {
        borrower,
        book,
        createdAt: '',
        updatedAt: '',
        returnDate: new Date(returnDate),
      });
      book.loans.add(newLoan);
      book.status = BookStatus.BORROWED;
      await ctx.em.persistAndFlush(book);

      await ctx.em.persistAndFlush(newLoan);
      message = `The book is now yours for the next ${LOAN_PERIOD} days.Please remember to return it on time!`;
    }
    return { message, book };
  }

  @Mutation(() => BookResponse) // a loan is created when a user borrows a book
  @UseMiddleware(isAuth)
  async reserve(
    @Arg('id') id: number,
    @Ctx() { em, req }: MyContext
  ): Promise<{ book: Book | null; message: string }> {
    const userId = req.session.userId;
    const reserver = await em.findOneOrFail(Member, { id: userId });
    const book = await em.findOneOrFail(Book, { id }, { populate: true });
    let message = '';

    const reservation = em.create(Reservation, {
      reserver,
      book,
      createdAt: '',
      updatedAt: '',
      status: ReservationStatus.PENDING,
    });
    book.reservations.add(reservation);
    await em.persistAndFlush(book);
    await em.persistAndFlush(reservation);
    message = `reservation successful!`;

    return { message, book };
  }
}

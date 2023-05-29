import { Book, BookStatus } from '../entities/Book';
import { MyContext } from '../types';
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
import { Loan, LoanStatus } from '../entities/Loan';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { searchBooksByTitle } from '../utils/getBook';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import cloudinary from '../utils/cloudConfig';

@InputType()
class NewBookInput {
  @Field(() => String)
  title!: string;

  @Field(() => String)
  author!: string;

  @Field(() => String)
  tag: string;
}

@InputType()
class BookUpdateInput {
  @Field(() => Int)
  id!: number;

  @Field(() => String)
  title?: string;

  @Field(() => String)
  subtitle?: string;

  @Field(() => String)
  author?: string;

  @Field(() => String)
  description?: string;
}

@InputType()
export class FileInput {
  @Field() filename: string;

  @Field() mimetype: string;

  @Field() encoding: string;
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
    return root.description.slice(0, 200);
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async searchBook(
    @Arg('searchTerm') searchTerm: string,
    @Ctx() { em }: MyContext
  ): Promise<Book[]> {
    const books = await em.find(
      Book,
      { title: { $fulltext: searchTerm } },
      { populate: true }
    );
    return books;
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
    console.log(bookSearch);

    const newBook = em.create(Book, {
      title,
      author: newAuthor,
      owner: member,
      status: BookStatus.AVAILABLE,
      createdAt: '',
      updatedAt: '',
      description: bookSearch.volumeInfo.description || '',
      subtitle: bookSearch.volumeInfo.subtitle,
      cover: bookSearch.volumeInfo.imageLinks.thumbnail,
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
    @Arg('options') options: BookUpdateInput,
    @Arg('cover', () => GraphQLUpload, { nullable: true })
    cover: FileUpload,
    @Ctx() { em, req }: MyContext
  ): Promise<BookResponse> {
    const userId = req.session.userId;
    const book = await em.findOneOrFail(
      Book,
      { id: options.id },
      { populate: true }
    );
    if (userId !== book.owner.id)
      return { book, message: 'you do not have access to this resource' };

    if (options.author) {
      const authorRef = em.getReference(Author, book.author.id);
      authorRef.name = options.author;
      await em.flush();
    }
    book.subtitle = options.subtitle || book.subtitle;
    book.description = options.description || book.description;

    if (cover) {
      const { createReadStream } = cover;
      const stream = await cloudinary.uploader.upload_stream(
        {
          folder: 'pagepals', // specify the folder name here
          public_id: cover.filename,
          overwrite: true,
        },
        async function (error: string, result: any) {
          if (error) {
            throw new Error(error);
          }
          // console.log(result); // Cloudinary response with uploaded image information
          book.cover = result.secure_url;
          await em.persistAndFlush(book); // if not, the cover is not saved with the rest of the changes :(
        }
      );
      createReadStream().pipe(stream);
    }
    await em.persistAndFlush(book);
    return { book };
  }

  @Query(() => [Book])
  async getBooks(@Ctx() { em }: MyContext): Promise<Book[]> {
    const allBooks = await em.find(
      Book,
      {},
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return allBooks;
  }

  @Query(() => [Book])
  async getBooksByOwner(
    @Arg('ownerId') ownerId: number,
    @Ctx() { em }: MyContext
  ): Promise<Book[]> {
    const books = await em.find(
      Book,
      { owner: ownerId },
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return books;
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
        status: LoanStatus.PENDING,
        lender: book.owner,
      });
      book.loans.add(newLoan);
      book.status = BookStatus.BORROWED; // book to be borrowed whether loan is pending or approved...to prevent new loans
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
      lender: book.owner,
    });
    book.reservations.add(reservation);
    await em.persistAndFlush(book);
    await em.persistAndFlush(reservation);
    message = `reservation successful!`;

    return { message, book };
  }
}

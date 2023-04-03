import {
  Connection,
  EntityManager,
  IDatabaseDriver,
  ISeedManager,
} from '@mikro-orm/core';
import { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { Book } from '../src/entities/Book';
import { BookSeeder } from '../src/seeders/BookSeeder';
import { MemberSeeder } from '../src/seeders/MemberSeeder';
import setup from './setup';

let request: SuperTest<Test>;
let app: Application;
let seeder: ISeedManager;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe('Book Entity Functions', () => {
  beforeAll(async () => {
    const {
      app: application,
      request: supertest,
      seeder: ormSeeder,
    } = await setup();
    app = application;
    request = supertest;
    seeder = ormSeeder;

    em = app.orm.em.fork();
  });

  afterAll(async () => {
    // Close connection
    await app.orm.close();
  });

  it('should find all books', async () => {
    await seeder.seed(MemberSeeder);
    await seeder.seed(BookSeeder);
    const response = await request
      .post('/graphql')
      .send({
        query: `
      query GetBooks {
        getBooks {
          title
          tags {
            name
          }
          reservations {
            reserver {
              username
              phoneNumber
            }
            createdAt
          }
          owner {
            username
            email
          }
          loans {
            createdAt
            borrower {
              username
            }
          }
          author {
            name
          }
        }
      }
      `,
      })
      .expect(200);
    expect(response.body.data.getBooks).toBeInstanceOf(Array); // whether empty or not
    expect(response.body.data.getBooks).toHaveLength(5);
  });

  it('should add a book', async () => {
    const response = await request.post('/graphql').send({
      query: `mutation {
        addBook(newBookData: { title: "The Great Fire", author: "Shirley Hazard", tag: "love"}) {
          id
          title
          tags {
            name
          }
          author {
            name
            id
          }
        }
      }
      `,
    });
    expect(response.status).toBe(200);
    expect(response.body.data).not.toBeNull();
    expect(Object.values(response.body.data.addBook)).toContain(
      'The Great Fire'
    );
  });

  it('should get a book by Id', async () => {
    const res = await request
      .post('/graphql')
      .send({
        query: `
      query {
        getBookById(id: 1) {
          id
          title
          tags {
            name
          }
          loans {
            returnDate
          }
        }
      }
      `,
      })
      .expect(200);

    expect(res.body.data.getBookById.id).toBe(1);
  });

  it('should update a book title', async () => {
    await seeder.seed(BookSeeder);
    const testBook = await em.findOneOrFail(Book, { id: 1 });
    const response = await request.post('/graphql').send({
      query: `
      mutation {
        updateBook(title: "${testBook.title}", newTitle: "The Pragmatic Programmer") {
          id
          title
          author {
            id
            name
          }
        }
      }
      `,
    });
    expect(response.status).toBe(200);
    expect(response.body.data.updateBook.title).toBe(
      'The Pragmatic Programmer'
    );
  });

  it('should delete a book', async () => {
    await seeder.seed(BookSeeder);
    const res = await request.post('/graphql').send({
      query: `
      mutation {
        deleteBook(id: 1)
      }
      `,
    });
    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body.data.deleteBook).toBe(204);
  });

  it('should create a book loan', async () => {
    await seeder.seed(BookSeeder);
    const testBook = await em.findOneOrFail(Book, { id: 1 });
    const response = await request.post('/graphql').send({
      query: `
		mutation {
      borrow(id: ${testBook.id}) {
        book {
          title
        }
      }
    }
		`,
    });

    console.log('ERROR:', response.error);
    console.log(response.body);
    expect(response.error).toBeNull();
    expect(response.status).toBe(200);
  });
});

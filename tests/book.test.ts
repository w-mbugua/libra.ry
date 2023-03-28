import {
  // EntityManager,
  // Connection,
  // IDatabaseDriver,
  ISeedManager,
} from '@mikro-orm/core';
import supertest, { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { BookSeeder } from '../src/seeders/BookSeeder';
import { MemberSeeder } from '../src/seeders/MemberSeeder';

let request: SuperTest<Test>;
let app: Application;
// let em: EntityManager<IDatabaseDriver<Connection>>;
let seeder: ISeedManager;

describe('Book Entity Functions', () => {
  beforeAll(async () => {
    app = new Application();
    app.port = 3500;
    await app.connect();
    await app.init();
    app.initRedis('test_lib:');

    // em = app.orm.em.fork();
    request = supertest(app.app);
    const generator = app.orm.getSchemaGenerator();
    seeder = app.orm.getSeeder();
    await generator.dropSchema({ wrap: false });
    await generator.createSchema({ wrap: false });
    await seeder.seed(MemberSeeder);
    await seeder.seed(BookSeeder);
  });


  afterAll(async () => {
    // Close connection
    await app.orm.close();
    // await app.redisClient.quit()
  });

  it('should find all books', async () => {
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
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.data).not.toBeNull();
    expect(Object.values(response.body.data.addBook)).toContain(
      'The Great Fire'
    );
  });

});

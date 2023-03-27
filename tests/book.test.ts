import {
  EntityManager,
  Connection,
  IDatabaseDriver,
  ISeedManager,
} from '@mikro-orm/core';
import supertest, { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { BookSeeder } from '../src/seeders/BookSeeder';
import { MemberSeeder } from '../src/seeders/MemberSeeder';
import Redis from 'ioredis-mock';
import { Member } from '../src/entities/Member';
import connectRedis from 'connect-redis';
import session from 'express-session';

jest.mock('ioredis', () => require('ioredis-mock'));

let request: SuperTest<Test>;
let app: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;
let seeder: ISeedManager;

const RedisStore: connectRedis.RedisStore = connectRedis(session);

describe('Book Entity Functions', () => {
  beforeAll(async () => {
    app = new Application();
    app.port = 3500;
    await app.connect();
    await app.init();

    const redisClient = new Redis();
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: 'test_lib:',
    });
    app.app.use(
      session({
        name: 'tst',
        store: redisStore,
        saveUninitialized: true,
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 20,
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
        },
      })
    );

    em = app.orm.em.fork();
    request = supertest(app.app);
    const generator = app.orm.getSchemaGenerator();
    seeder = app.orm.getSeeder();
    await generator.dropSchema({ wrap: false });
    await generator.createSchema({ wrap: false });
    await seeder.seed(MemberSeeder);
    await seeder.seed(BookSeeder);
  });

  beforeEach(async () => {
    // get user
    const user1 = await em.findOneOrFail(Member, { id: 1 });
    app.app.use((req, _res, next) => {
      req.session.userId = user1.id; // set the userId key in the session
      next();
    });
  });

  afterAll(async () => {
    // Close connection
    await app.orm.close();
  });

  // afterAll(async () => {
  //   await server.stop()
  // });

  // afterEach(async () => {
  //   await orm.em.nativeDelete(Book, {});
  // });


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
    })
    console.log(response.body);
    expect(response.status).toBe(200)
    expect(response.body.data).not.toBeNull();
    expect(Object.values(response.body.data.addBook)).toContain(
      'The Great Fire'
    );
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
});

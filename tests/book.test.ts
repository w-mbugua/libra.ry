import { ISeedManager } from '@mikro-orm/core';
import { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { BookSeeder } from '../src/seeders/BookSeeder';
import { MemberSeeder } from '../src/seeders/MemberSeeder';
import setup from './setup';

let request: SuperTest<Test>;
let app: Application;
let seeder: ISeedManager;

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
  });

  afterAll(async () => {
    // Close connection
    await app.orm.close();
    // await app.redisClient.quit()
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
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.data).not.toBeNull();
    expect(Object.values(response.body.data.addBook)).toContain(
      'The Great Fire'
    );
  });
});

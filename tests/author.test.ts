import { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { AuthorSeeder } from '../src/seeders/AuthorSeeder';
import setup from './setup';

let request: SuperTest<Test>;
let app: Application;

describe('Author Functions', () => {
  beforeAll(async () => {
    const { app: application, request: supertest, seeder } = await setup();
    app = application;
    request = supertest;

    await seeder.seed(AuthorSeeder);
  });

  afterAll(async () => {
    await app.orm.close();
  });

  it('should get authors', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `
		query Authors {
			getAuthors {
			  id
			   name
			  books {
				loans {
				  borrower {
					username
				  }
				}
				tags {
				  name
				}
				owner {
				  username
				}
			  }
			}
		  }
		`,
      })
      .expect(200);
    const data = response.body.data.getAuthors;
    expect(data).toBeInstanceOf(Array);
    expect(data).not.toBeNull();
  });

  it('should add author', async () => {
    const response = await request.post('/graphql').send({
      query: `mutation {
		addAuthor("newAuthorData": {name: "Jeffrey Archer"}) {
		  name
		  books {
			title
		  }
		}
	  }
	  
		`,
    });
    const data = response.body.data;
    console.log(response.error);

    expect(response.status).toBe(200);
    expect(data).not.toBeNull();
    expect(data.addAuthor.name).toBe('Jeffrey Archer');
  });
});

import { ISeedManager } from '@mikro-orm/core';
import supertest, { SuperTest, Test } from 'supertest';
import Application from '../src/application';
import { AuthorSeeder } from '../src/seeders/AuthorSeeder';

let request: SuperTest<Test>;
let app: Application;
let seeder: ISeedManager;

describe('Author Functions', () => {
  beforeAll(async () => {
    app = new Application();
    await app.connect();
    await app.init();

    request = supertest(app.app);
    const generator = app.orm.getSchemaGenerator();
    seeder = app.orm.getSeeder();
    await generator.dropSchema({ wrap: false });
    await generator.createSchema({ wrap: false });
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
		addAuthor(name: "Jeffrey Archer") {
		  name
		  books {
			title
		  }
		}
	  }
	  
		`,
    });
    const data = response.body.data;
    expect(response.status).toBe(200);
    expect(data).not.toBeNull();
    expect(data.addAuthor.name).toBe('Jeffrey Archer');
  });
});

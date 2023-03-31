import { ISeedManager } from '@mikro-orm/core';
import supertest, { SuperTest, Test } from 'supertest';
import Application from '../src/application';

let request: SuperTest<Test>;
let app: Application;
let seeder: ISeedManager;
export default async function setup() {
	app = new Application();
    await app.connect();
    await app.init();

    request = supertest(app.app);
    const generator = app.orm.getSchemaGenerator();
    seeder = app.orm.getSeeder();
    await generator.dropSchema({ wrap: false });
    await generator.createSchema({ wrap: false });
    

	return {app, request, seeder}
}
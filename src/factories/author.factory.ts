import { Factory, Faker } from '@mikro-orm/seeder';
import { Author } from '../entities/Author';

export class AuthorFactory extends Factory<Author> {
  model = Author;

  definition(faker: Faker): Partial<Author> {
    return {
      name: faker.name.fullName(),
    };
  }
}
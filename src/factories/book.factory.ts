import { Factory, Faker } from '@mikro-orm/seeder';
import { Book } from '../entities/Book';

export class BookFactory extends Factory<Book> {
  model = Book;

  definition(faker: Faker): Partial<Book> {
    return {
      title: faker.lorem.word({
        length: { min: 5, max: 7 },
        strategy: 'closest',
      }),
    };
  }
}

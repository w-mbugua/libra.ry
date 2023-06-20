import { Factory, Faker } from '@mikro-orm/seeder';
import { Tag } from '../entities/Tag';

export class TagFactory extends Factory<Tag> {
  model = Tag;

  definition(faker: Faker): Partial<Tag> {
    return {
	  name: faker.helpers.unique(faker.word.noun)
    };
  }
}
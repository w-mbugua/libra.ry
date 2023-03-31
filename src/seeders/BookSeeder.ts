import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Member } from '../entities/Member';
import { AuthorFactory } from '../factories/author.factory';
import { BookFactory } from '../factories/book.factory';
import { TagFactory } from '../factories/tag.factory';

export class BookSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const author = await new AuthorFactory(em).createOne();
    const owner = await em.findOneOrFail(Member, { id: 1 });

    await new BookFactory(em)
      .each(async (book) => {
        book.author = author;
        book.owner = owner;
        const bookTags = await new TagFactory(em).create(2);
        book.tags.add(bookTags);
      })
      .create(5);
  }
}

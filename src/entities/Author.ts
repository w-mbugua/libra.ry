import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Book } from './Book';

@Entity()
export class Author {
  @PrimaryKey()
  id: string;

  @OneToMany(() => Book, (book) => book.author)
  books = new Collection<Book>(this);
}

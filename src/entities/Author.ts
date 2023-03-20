import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';

@ObjectType()
@Entity()
export class Author {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property({ hidden: true })
  name!: string;

  @Field(() => [Book])
  @OneToMany(() => Book, (book: Book) => book.author)
  books = new Collection<Book>(this);
}

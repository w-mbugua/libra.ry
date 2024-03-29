import {
  Cascade,
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
  @Property({ hidden: true, unique: true })
  name!: string;

  @Field(() => [Book])
  @OneToMany(() => Book, (book: Book) => book.author, {
    cascade: [Cascade.PERSIST],
  })
  books = new Collection<Book>(this);
}

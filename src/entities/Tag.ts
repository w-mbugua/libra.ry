import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Field } from 'type-graphql';
import { Book } from './Book';

@Entity()
export class Tag {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => String)
  @Property()
  name: string;

  @Field(() => [Book])
  @ManyToMany(() => Book, (b: Book) => b.tags)
  books = new Collection<Book>(this)
}

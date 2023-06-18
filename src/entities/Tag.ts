import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';

@ObjectType()
@Entity()
export class Tag {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => String)
  @Property({ unique: true })
  name: string;

  @Field(() => [Book])
  @ManyToMany(() => Book, (b: Book) => b.tags)
  books = new Collection<Book>(this)
}

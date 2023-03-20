import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, ObjectType } from 'type-graphql';
import { Book } from './Book';

@ObjectType()
@Entity()
export class User {
  @Field()
  @PrimaryKey()
  id: number;

  @Field()
  @Property({ hidden: true })
  firstName!: string;

  @Field()
  @Property({ hidden: true })
  lastName!: string;

  @Field()
  @Property()
  email!: string;

  @Field()
  @Property()
  phoneNumber!: string;

  @Property()
  password!: string;

  @Field(() => [Book])
  @OneToMany(() => Book, (book: Book) => book.owner)
  books = new Collection<Book>(this);

  @Property({ name: 'fullName' })
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

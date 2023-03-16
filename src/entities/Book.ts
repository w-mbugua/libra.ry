import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Author } from "./Author";

@ObjectType()
@Entity()
export class Book {
	@Field()
	@PrimaryKey()
	id: number;
	
	@Field(() => String)
	@Property()
	title!: string;
	
	@Field(() => Author)
	@ManyToOne(() => Author)
	author!: Author
}


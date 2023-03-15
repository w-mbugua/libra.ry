import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Author } from "./Author";

@Entity()
export class Book {
	@PrimaryKey()
	id: string;

	@Property()
	title!: string;
	
	@ManyToOne('Author')
	author!: Author
}
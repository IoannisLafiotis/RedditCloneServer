import {Entity,PrimaryKey,Property} from "@mikro-orm/core";
import { ObjectType, Field, Int } from "type-graphql";
// import { type } from "os";


@ObjectType()
@Entity()
export class Post {

  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({type: "date"})
  createdAt = new Date();
  
  @Field(() => String)
  @Property({type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field(() => String)
  @Property({type: "text"})
  title!: string;

}
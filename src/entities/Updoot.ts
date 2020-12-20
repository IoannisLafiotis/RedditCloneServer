import {  Field } from "type-graphql";
import {Entity, BaseEntity, ManyToOne, PrimaryColumn, Column} from "typeorm"
import { User } from "./User";
import { Post } from "./Post";

// many to many relation
// many users can update many posts!

@Entity()
export class Updoot extends BaseEntity {
    @Column({type: "int"})
    value:number



  @PrimaryColumn()
  userId: number;
  
  @Field(() => User)
  @ManyToOne(() => User,user => user.updoots)
  user:User;

  @PrimaryColumn()
  postId: number;

  @Field(() => Post)
  @ManyToOne(() => Post,post => post.updoots,{
      onDelete: "CASCADE"
  })
  post:Post;
}
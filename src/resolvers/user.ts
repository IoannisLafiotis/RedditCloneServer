import {Resolver, Ctx, Arg, Mutation, Field, ObjectType, Query, Root, FieldResolver} from "type-graphql";
import {MyContext} from "../types"
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import {v4} from "uuid"
import { getConnection } from "typeorm";



@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;

}



@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable:true})
    errors?: FieldError[];

    @Field(() => User, {nullable:true})
    user?: User;
} 



@Resolver(User)
export class UserResolver {

    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() {req}: MyContext) {
        // this is the current user and its ok to show them their own email
        if(req.session.userId === user.id){
            return user.email;
        }
        /// current user wants to see someone elses email
        return "";   
    }



    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token:string,
        @Arg("newPassword") newPassword:string,
        @Ctx() {redis,req}:MyContext
    ):Promise<UserResponse>{
        if(newPassword.length < 2){
            return  {errors:[
                {
                    field:"newPassword",
                    message:"New password must be greater than 2!"
                }
            ]}
        }
        // getting the hey with redis ...
        // the prefix and the token from the auth..
        const key = FORGET_PASSWORD_PREFIX + token
        const userId = await redis.get(key);
        if(!userId){
            return {
                errors:[
                    {
                        field:"token",
                        message: "token expired"
                    }
                ]
            }
        }
        const userIdNum = parseInt(userId)
        const user = await User.findOne(userIdNum);
        if(!user){
            return {
                errors:[
                    {
                        field:"user",
                        message: "User does not exist!"
                    }
                ]
            }
        }
        
        await User.update({id:userIdNum},{
            password:await argon2.hash(newPassword)
        });

        // we delete the key so that you can not go to change password for the same token!
        await redis.del(key);

        // log in user after change password
            req.session.userId = user.id;
        return {user};
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() {redis} : MyContext
    ) {
        // when we are searching but not with the primary column then we use where
        const user = await User.findOne({where: {email}});
        if(!user){
            // the email is not in the db
            return true;
        }
        const token = v4();

        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, "ex", 1000 * 60 * 60)
        
        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
        )
        
        return true
    }


        @Query(() => User,{nullable:true})
        async me(
            @Ctx() {req}:MyContext
        ) {
            if(req.session.userId){
                return null;
            }
            const user = await User.findOne(req.session.userId);


            return user;
        }


        @Mutation(() => UserResponse)
        async register(
        @Arg("options") options: UsernamePasswordInput ,
        @Ctx() {req}: MyContext
        ):Promise<UserResponse>{
            const errors = validateRegister(options)
            if(errors){
                return {errors};
            }

            const hashedPassword = await argon2.hash(options.password)
            // const user = em.create(User,{username: options.username , password: hashedPassword})
            let user;
            try{
                // User.create({properties}).save()
            const result = await getConnection().createQueryBuilder().insert().into(User).values({
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,

                }).returning("*").execute();
            //    const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
            //         username: options.username,
            //         password: hashedPassword,
            //         email: options.email,
            //         created_at: new Date(),
            //         updated_at: new Date()
            //     }).returning("*");
                // await em.persistAndFlush(user)
                // user = result[0];
                console.log(result);
                user = result.raw[0];

            } catch(err){
                console.log("err",err)
                console.log("message: ",err.message)
                if(err.code === "23505"){
                    return {
                        errors:[{
                            field:"username",
                            message:"Username already taken!"
                        }]
                    }
                }
            }

            // this will store the user id
            // store the cookie to the user
            // will keep them logged in

            req.session.userId = user.id;
            return {user};
        } 

        // Changing the input type so it can be more flexible!!!
        @Mutation(() => UserResponse)
        async login(
        @Arg("usernameOrEmail") usernameOrEmail: string ,
        @Arg("password") password: string ,
        @Ctx() { req }: MyContext
        ): Promise<UserResponse>{
            const user = await User.findOne(usernameOrEmail.includes("@") ?
             { where: {email: usernameOrEmail} } :
            {where: {username: usernameOrEmail}})
            if(!user){
                return {
                    errors:[
                        {
                        field: "usernameOrEmail",
                        message: "That user doesnt exist in the database!"
                    }]
                }
            }

            const valid = await argon2.verify(user.password, password)
            if(!valid){
                return {
                    errors:[
                        {
                        field: "password",
                        message: "That password is incorrect!"
                    }]
                }
            }
            req.session.userId = user.id;

            return {
                user
            };
        } 

        @Mutation(() => Boolean)
        logout(
            @Ctx() {req,res}: MyContext
        ) {
          return new Promise(resolve => req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME);  
              if(err){
                  console.log(err)
                  resolve(false)
                  return
              }

              resolve(true); 
          })

          )
        }


    // @Query(() => [User])
    //     users(@Ctx() {em}: MyContext):Promise<User[]>{
    //         return em.find(User,{});
    //     } 

    //     @Query(() => User , {nullable: true})
    //     user(
    //     @Arg("id",() => Int) id: number,
    //     @Ctx() {em}: MyContext):Promise<User | null>{
    //         return em.findOne(User,{id});
    //     } 
        
        // @Mutation(() => User)
        // async createUser(
        // @Arg("title",() => String) title: string,
        // @Ctx() {em}: MyContext):Promise<User>{
        //     const user = em.create(User,{title})
        //     await em.persistAndFlush(user)
        //     return user;
        // } 
        // @Mutation(() => User, {nullable:true})
        // async updateUser(
        // @Arg("id",() => Int) id: number,
        // @Arg("title",() => String, {nullable:true}) title: string,
        // @Ctx() {em}: MyContext):Promise<User | null>{
        //     const user = await em.findOne(User,{id});
        //     if(!user){
        //         return null;
        //     }
        //     if(typeof title !== "undefined"){
        //         user.title = title;
        //         await em.persistAndFlush(user)
        //     }
        //     return user;
        // } 
    } 
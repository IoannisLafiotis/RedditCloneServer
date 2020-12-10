import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__, COOKIE_NAME } from "./entities";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import cors from "cors";

import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from "connect-redis";


const main = async () => {
    // sendEmail("bobby.com","hello there")
    const orm = await MikroORM.init(mikroConfig)

    await orm.getMigrator().up();

    const app = express();


    const RedisStore = connectRedis(session)
    const redis = new Redis();

    app.use(cors({
        origin:"http://localhost:3000",
        credentials:true
    }));
    app.use(
    session({
        name: COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch:true }),
        cookie:{maxAge: 1000 * 60 * 60 * 24 , httpOnly:true, sameSite:"lax", secure:__prod__},
        saveUninitialized:false,
        secret: 'secret',
        resave: false,
  })
)
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req,res}) => ({em : orm.em,req,res,redis })
    })


    apolloServer.applyMiddleware({app, cors: false});

   app.listen(4000,()=> {
    console.log("server started on localhost:4000");
   })
    // const posts = await orm.em.find(Post,{});
    // console.log(posts);
}   


main().catch(err =>{
    console.error(err)
})
console.log("hello world");
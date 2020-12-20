import "reflect-metadata";
// import { MikroORM } from "@mikro-orm/core";
import { __prod__, COOKIE_NAME } from "./entities";
// import { Post } from "./entities/Post";
// import mikroConfig from "./mikro-orm.config";
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
import { createConnection} from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
const main = async () => {

    const conn = await createConnection({
        type:"postgres",
        database:"lirredit2",
        username:"postgres",
        password:"postgres",
        logging:true,
        synchronize:true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities:[User,Post,Updoot]
    })

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
        context: ({req,res}) => ({req,res,redis, userLoader: createUserLoader(), updootLoader: createUpdootLoader() })
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

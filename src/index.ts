import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./entities";
// import { Post } from "./entities/Post";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: true
        }),
        context: () => ({em : orm.em})
    })


    apolloServer.applyMiddleware({app});

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
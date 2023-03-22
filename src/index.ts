import * as dotenv from 'dotenv';
dotenv.config();
import { MikroORM, RequestContext } from '@mikro-orm/core';
import express from 'express';
import config from './mikro-orm.config';
// apollo
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { buildSchema } from 'type-graphql';
import { MemberResolver } from './resolvers/Member';
import { BookResolver } from './resolvers/Book';
import { AuthorResolver } from './resolvers/Author';
import { MyContext } from './types';
import { json } from 'body-parser';
import { TagResolver } from './resolvers/Tag';
import connectRedis from 'connect-redis';
import session from 'express-session';
import Redis from 'ioredis';

const RedisStore = connectRedis(session);

async function main() {
  const orm = await MikroORM.init(config);
  const migrator = orm.getMigrator();
  const pending = await migrator.getPendingMigrations();
  await migrator.up();
  console.log('PENDING:', pending.length);
  await RequestContext.createAsync(orm.em, async () => {});

  const app = express();

  const redisClient = new Redis(process.env.REDIS_URL as string);
  const corsOptions = {
    credentials: true,
    origin: 'https://sandbox.embed.apollographql.com'
    // origin: process.env.CORS_ORIGIN,
  };

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'lib:',
  });

  app.use(
    session({
      name: 'swq',
      store: redisStore,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
      },
    })
  );

  // request handlers
  app.get('/ping', (_req, res) => {
    res.send('pong');
  });

  //custom midware

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [MemberResolver, BookResolver, AuthorResolver, TagResolver],
      emitSchemaFile: true,
      validate: false,
    }),
  });
  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => ({
        req,
        res,
        em: orm.em.fork(),
        redis: redisClient,
      }),
    })
  );
  const port = 4000;
  app.listen(port, () => {
    console.log('listenin on port: ', port);
  });
}

main().catch((err) => {
  console.log(err);
});

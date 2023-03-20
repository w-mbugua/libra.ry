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
import { UserResolver } from './resolvers/User';
import { BookResolver } from './resolvers/Book';
import { AuthorResolver } from './resolvers/Author';
import { MyContext } from './types';
import { json } from 'body-parser';
import { TagResolver } from './resolvers/Tag';

async function main() {
  const orm = await MikroORM.init(config);
  const migrator = orm.getMigrator();
  const pending = await migrator.getPendingMigrations();
  await migrator.up();
  console.log('PENDING:', pending.length);

  await RequestContext.createAsync(orm.em, async () => {});

  const app = express();

  // request handlers
  app.get('/ping', (_req, res) => {
    res.send('pong');
  });

  //custom midware

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, BookResolver, AuthorResolver, TagResolver],
      emitSchemaFile: true,
      validate: false,
    }),
  });
  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => ({
        req,
        res,
        em: orm.em.fork(),
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

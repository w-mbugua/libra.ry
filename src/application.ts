import {
  Connection,
  IDatabaseDriver,
  MikroORM,
  RequestContext,
} from '@mikro-orm/core';
import express from 'express';
import { json } from 'body-parser';
import { Server } from 'http';
import { Redis } from 'ioredis';
import config from './mikro-orm.config';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { COOKIE_NAME } from './utils/constants';
import { GraphQLSchema } from 'graphql';
import { buildSchema } from 'type-graphql';
import { AuthorResolver } from './resolvers/Author';
import { BookResolver } from './resolvers/Book';
import { MemberResolver } from './resolvers/Member';
import { TagResolver } from './resolvers/Tag';
import { ApolloServer, BaseContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { MyContext } from './types';

const RedisStore = connectRedis(session);

export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public app: express.Application;
  public server: Server;
  public redisClient: Redis;
  public redisStore: connectRedis.RedisStore;
  public corsOptions: any;

  public connect = async (): Promise<void> => {
    try {
      this.orm = await MikroORM.init(config);
      const migrator = this.orm.getMigrator();
      const pending = await migrator.getPendingMigrations();
      await migrator.up();
      console.log('PENDING:', pending.length);
      await RequestContext.createAsync(this.orm.em, async () => {});
    } catch (err) {
      console.error('DB connection failed');
      throw new Error(err);
    }
  };

  public initRedis = (): void => {
    this.redisClient = new Redis(process.env.REDIS_URL as string);
    this.redisStore = new RedisStore({
      client: this.redisClient,
      prefix: 'lib:',
    });
    this.app.use(
      session({
        name: COOKIE_NAME,
        store: this.redisStore,
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
  };

  public init = async (): Promise<void> => {
    this.app = express();
    this.corsOptions = {
      credentials: true,
      origin: 'https://sandbox.embed.apollographql.com',
      // origin: process.env.CORS_ORIGIN,
    };

    //* building schema
    const schema: GraphQLSchema = await buildSchema({
      resolvers: [MemberResolver, BookResolver, AuthorResolver, TagResolver],
      emitSchemaFile: true,
      validate: false,
    });

    const server: ApolloServer<BaseContext> = new ApolloServer({ schema });
    await server.start();

    this.app.use(
      '/graphql',
      cors<cors.CorsRequest>(this.corsOptions),
      json(),
      expressMiddleware(server, {
        context: async ({ req, res }): Promise<MyContext> => ({
          req,
          res,
          em: this.orm.em.fork(),
          redis: this.redisClient,
        }),
      })
    );

    const port = process.env.PORT || 4000;
    this.server = this.app.listen(port, () => {
      console.log('listenin on port: ', port);
    });
  };

  public ping = (): void => {
    this.app.get('/ping', (req, res) => {
      res.send('pong');
    });
  };
}

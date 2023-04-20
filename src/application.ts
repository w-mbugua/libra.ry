import * as dotenv from 'dotenv';
dotenv.config();
import {
  Connection,
  IDatabaseDriver,
  MikroORM,
  RequestContext,
} from '@mikro-orm/core';
import express from 'express';
import { json } from 'body-parser';
import Redis from 'ioredis';
import config from './mikro-orm.config';
import connectRedis from 'connect-redis';
import session, { Session, SessionData } from 'express-session';
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
  public redisClient: Redis;
  public redisStore: connectRedis.RedisStore;
  public corsOptions: any;
  public port: number = Number(process.env.NODE_ENV) || 4000;

  public connect = async (): Promise<void> => {
    try {
      this.orm = await MikroORM.init(config);
      const migrator = this.orm.getMigrator();
      const pending = await migrator.getPendingMigrations();
      console.log('PENDING:', pending.length);
      if(pending.length) await migrator.up();
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
      // prefix,
    });

    const sessionMiddleware = session({
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
    });

    this.app.use(sessionMiddleware);
  };

  public init = async (): Promise<void> => {
    this.app = express();
    this.corsOptions = {
      credentials: true,
      origin: ['https://sandbox.embed.apollographql.com', 'http://localhost:3000', 'http://localhost:3001'],
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
        context: async ({ req, res }): Promise<MyContext> => {
          if (!req.session && process.env.NODE_ENV === 'test') {
            req.session = {
              userId: 1,
            } as Session & Partial<SessionData>;
          }
          return {
            req,
            res,
            em: this.orm.em.fork(),
            redis: this.redisClient,
          };
        },
      })
    );
  }
}

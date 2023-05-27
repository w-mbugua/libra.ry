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
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { AuthorResolver } from './resolvers/Author';
import { BookResolver } from './resolvers/Book';
import { MemberResolver } from './resolvers/Member';
import { TagResolver } from './resolvers/Tag';
import { ApolloServer, BaseContext } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { MyContext } from './types';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { LoanResolver } from './resolvers/Loan';
import { ReservationResolver } from './resolvers/Reservation';
import { ConversationResolver } from './resolvers/Conversation';
import { MessageResolver } from './resolvers/Message';
import { IncomingMessage, Server, ServerResponse, createServer } from 'http';
import { RedisPubSub } from 'graphql-redis-subscriptions';

const RedisStore = connectRedis(session);

export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public redisClient: Redis;
  public redisStore: connectRedis.RedisStore;
  public corsOptions: any;
  public port: number = Number(process.env.NODE_ENV) || 4000;
  public app: express.Application = express();
  // can't use express app for subscriptions
  public httpServer: Server<typeof IncomingMessage, typeof ServerResponse>;
  public pubsub: RedisPubSub;

  public connect = async (): Promise<void> => {
    try {
      this.orm = await MikroORM.init(config);
      const migrator = this.orm.getMigrator();
      const pending = await migrator.getPendingMigrations();
      console.log('PENDING:', pending.length);
      if (pending.length) await migrator.up();
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
    this.corsOptions = {
      credentials: true,
      origin: [
        'https://sandbox.embed.apollographql.com',
        'http://localhost:3005',
      ],
      // origin: process.env.CORS_ORIGIN,
    };

    //* building schema
    const schema: GraphQLSchema = await buildSchema({
      resolvers: [
        MemberResolver,
        BookResolver,
        AuthorResolver,
        TagResolver,
        LoanResolver,
        ReservationResolver,
        ConversationResolver,
        MessageResolver,
      ],
      emitSchemaFile: true,
      validate: false,
      pubSub: new RedisPubSub({
        publisher: new Redis(process.env.REDIS_URL as string),
        subscriber: new Redis(process.env.REDIS_URL as string),
      }),
    });

    // pubsub class

    this.httpServer = createServer(this.app);
    const wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/graphql/subscriptions',
    });
    const serverCleanup = useServer({ schema }, wsServer);

    const server: ApolloServer<BaseContext> = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    this.app.use(
      '/graphql',
      cors<cors.CorsRequest>(this.corsOptions),
      json(),
      graphqlUploadExpress({ maxFileSize: 1000000, maxFiles: 1 }),
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
            pubsub: this.pubsub,
          };
        },
      })
    );
  };
}

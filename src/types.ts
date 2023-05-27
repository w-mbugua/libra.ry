import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { Session } from 'express-session';
import { RedisPubSub } from 'graphql-redis-subscriptions';
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
export type MyContext = {
  req: Request & { session: Session };
  res: Response;
  em: EntityManager<IDatabaseDriver<Connection>>;
  redis: Redis;
  pubsub: RedisPubSub;
};

export interface BookDetails {
  id: string;
  volumeInfo: {
    title: string;
    subtitle: string;
    authors: string[];
    description: string;
    publishedDate: string;
    publisher: string;
    pageCount: number;
    language: string;
    categories: string[];
    averageRating: number;
    ratingsCount: number;
    imageLinks: {
      smallThumbnail: string;
      thumbnail: string;
    };
  };
}


import { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { Session } from 'express-session';
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
};

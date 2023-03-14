import { MikroORM, RequestContext } from '@mikro-orm/core';
import express from 'express';
import config from './mikro-orm.config';

async function main() {
  const orm = await MikroORM.init(config);

  const app = express();
  // You should register this middleware as the last one just before request handlers
  // and before any of your custom middleware that is using the ORM.
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });
  // request handlers
  //custom midware
  const port = 4000;

  app.get('/ping', (req, res) => {
    res.send('pong');
  });
  app.listen(port, () => {
    console.log('listenin on port: ', port);
  });
}

main().catch((err) => {
  console.log(err);
});

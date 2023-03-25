import * as dotenv from 'dotenv';
dotenv.config();

import Application from './application';

async function main() {
  const app = new Application();
  app.connect();
  app.init();
  app.initRedis();
  app.ping();
}

main().catch((err) => {
  console.log('ERROR', err);
});

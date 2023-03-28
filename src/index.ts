import Application from './application';

async function main() {
  const app = new Application();
  app.connect();
  app.init();
  app.initRedis('lib:');
  app.ping();
}

main().catch((err) => {
  console.log('ERROR', err);
});

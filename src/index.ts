import Application from './application';

async function main() {
  const app = new Application();
  await app.connect();
  await app.init();
  app.initRedis('lib:');

  app.app.listen(process.env.PORT || 4000, () => {
    console.log('listenin on port: ');
  });

  app.app.get('/ping', (_req, res) => {
    res.send('pong');
  });
}

main().catch((err) => {
  console.log('ERROR', err);
});

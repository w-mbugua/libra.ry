import Application from './application';

async function main() {
  const app = new Application();
  app.connect();
  app.initRedis();
  await app.init();

  const port = process.env.PORT || 4000;
  app.httpServer.listen(port, () => {
    console.log('listenin on port: ', port);
  });

  app.app.get('/ping', (_req, res) => {
    res.send('pong');
  });

  app.app.post('/testing/reset', async (_req, res) => {
    if (process.env.NODE_ENV === 'test') {
      const generator = app.orm.getSchemaGenerator();
      await generator.dropSchema({ wrap: false });
      await generator.createSchema({ wrap: false });

      res.status(204).end();
    }
  });
}

main().catch((err) => {
  console.log('ERROR', err);
});

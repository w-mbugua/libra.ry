import { Options } from '@mikro-orm/core';

const config: Options = {
  entities: ['./dist/entities'],
  dbName: 'libra',
  type: 'postgresql',
};

export default config;

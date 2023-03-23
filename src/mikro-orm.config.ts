import { Options } from '@mikro-orm/core';
import path from 'path';
import { __prod__ } from './utils/constants';

const config: Options = {
  migrations: {
    path: path.join(__dirname, './migrations'),
    glob: '!(*.d).{js,ts}',
  },
  entities: ['./dist/entities'],
  clientUrl: process.env.DATABASE_URL,
  type: 'postgresql',
  debug: !__prod__,
};

export default config;

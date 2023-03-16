import { Options } from '@mikro-orm/core';
import path from 'path';
import { __prod__ } from './constants';

console.log("ENV", process.env.DATABASE_URL);
console.log("ENV", process.env.DB_USER);

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

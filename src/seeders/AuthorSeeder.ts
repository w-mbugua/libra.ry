import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

export class AuthorSeeder extends Seeder {

  async run(_em: EntityManager): Promise<void> {}

}

import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { MemberFactory } from '../factories/member.factory';

export class MemberSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await new MemberFactory(em).createOne();
  }
}

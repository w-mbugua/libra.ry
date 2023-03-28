import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as argon2 from 'argon2';
import { MemberFactory } from '../factories/member.factory';

export class MemberSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const newMember = new MemberFactory(em).makeOne({
      password: 'soluta',
    });
    const hashedPassword = await argon2.hash(newMember.password);
    newMember.password = hashedPassword;
    em.persist(newMember);
  }
}

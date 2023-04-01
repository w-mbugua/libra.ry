import { Factory, Faker } from '@mikro-orm/seeder';
import { Member } from '../entities/Member';

export class MemberFactory extends Factory<Member> {
  model = Member;

  definition(faker: Faker): Partial<Member> {
    return {
      username: faker.name.fullName(),
      email: faker.internet.email(),
      password: faker.lorem.word(6),
      phoneNumber: faker.phone.number('+2547#########'),
    };
  }
}

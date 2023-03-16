import { MyContext } from 'src/types';
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql';
import { User } from '../entities/User';

@InputType()
class NewUserInput {
  @Field(() => String)
  firstName!: string;

  @Field(() => String)
  lastName!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  phonNumber!: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async addUser(
    @Arg('newUserData') newUserData: NewUserInput,
    @Ctx() ctx: MyContext
  ): Promise<User> {
    const newUser = ctx.em.create(User, { ...newUserData });
    await ctx.em.persistAndFlush(newUser);
    return newUser;
  }
}

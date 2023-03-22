import { MyContext } from '../types';
import { validateLogin, validateRegister } from '../validators/member';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from 'type-graphql';
import { Member } from '../entities/Member';
import * as argon2 from 'argon2';

@InputType()
export class NewMemberInput {
  @Field(() => String)
  username!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  phoneNumber!: string;

  @Field(() => String)
  password!: string;
}

@InputType()
export class LoginInput {
  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String)
  password!: string;
}

@ObjectType()
class FieldError {
  @Field()
  field!: string;

  @Field()
  message!: string;
}

@ObjectType()
class MemberResponse {
  @Field(() => [FieldError], { nullable: true })
  error?: FieldError[];

  @Field(() => Member, { nullable: true })
  member?: Member;
}

@Resolver()
export class MemberResolver {
  @Mutation(() => MemberResponse)
  async register(
    @Arg('newMemberData') newMemberData: NewMemberInput,
    @Ctx() ctx: MyContext
  ): Promise<MemberResponse> {
    const error = validateRegister(newMemberData);
    if (error?.length) return { error };

    const hashedPassword = await argon2.hash(newMemberData.password);
    console.log('HASHED', hashedPassword);

    const member = ctx.em.create(Member, {
      ...newMemberData,
      password: hashedPassword,
    });
    console.log('MEMBER', member);

    await ctx.em.persistAndFlush(member);
    ctx.req.session.userId = member.id;
    return { member };
  }

  @Mutation(() => MemberResponse)
  async login(
    @Arg('loginInput') loginInput: LoginInput,
    @Ctx() ctx: MyContext
  ): Promise<MemberResponse> {
    const error = validateLogin(loginInput);
    if (error?.length) return { error };
    const member = await ctx.em.findOneOrFail(
      Member,
      loginInput.username
        ? { username: loginInput.username }
        : { email: loginInput.email }
    );
    if (!member) {
      return {
        error: [
          { field: 'username or email', message: 'member could not be found' },
        ],
      };
    }

    const isValid = await argon2.verify(member.password, loginInput.password);
    if (!isValid) {
      return {
        error: [{ field: 'password', message: 'incorrect password' }],
      };
    }
    ctx.req.session.userId = member.id;
    return { member };
  }
}

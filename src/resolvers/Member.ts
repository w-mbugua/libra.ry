import * as argon2 from 'argon2';
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
import { MyContext } from '../types';
import { validateLogin, validateRegister } from '../validators/member';
import { v4 } from 'uuid';
import { FORGET_PASSWORD_PREFIX } from '../constants';
import sendMail from '../utils/sendMail';

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

  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() ctx: MyContext) {
    const user = await ctx.em.findOneOrFail(Member, { email });
    if (!user) return true;

    const token = v4();
    await ctx.redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      'EX',
      1000 * 60 * 60 * 24 * 3
    );
    await sendMail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`);
    return true;
  }

  @Mutation(() => Member)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: MyContext
  ): Promise<MemberResponse> {
    const userId = await ctx.redis.get(FORGET_PASSWORD_PREFIX + token);
    if (!userId) {
      return {
        error: [
          {
            field: 'token',
            message: 'invalid token',
          },
        ],
      };
    }
    const user = await ctx.em.findOneOrFail(Member, { id: Number(userId) });
    if (!user) {
      return {
        error: [
          {
            field: 'user',
            message: 'user no longer exists',
          },
        ],
      };
    }
    const password = await argon2.hash(newPassword);
    user.password = password;
    await ctx.em.persistAndFlush(user);
    return { member: user };
  }
}

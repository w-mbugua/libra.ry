import * as argon2 from 'argon2';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { v4 } from 'uuid';
import { Member } from '../entities/Member';
import { MyContext } from '../types';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../utils/constants';
import sendMail from '../utils/sendMail';
import { validateLogin, validateRegister } from '../validators/member';
import { isAuth } from '../middleware/isAuth';

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
  phoneNumber?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String)
  password!: string;
}

@ObjectType()
export class FieldError {
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
  @Query(() => Member)
  async currentUser(@Ctx() ctx: MyContext) {
    const user = await ctx.em.findOne(Member, { id: ctx.req.session.userId });
    return user;
  }

  @Mutation(() => MemberResponse)
  async register(
    @Arg('newMemberData') newMemberData: NewMemberInput,
    @Ctx() ctx: MyContext
  ): Promise<MemberResponse> {
    const error = validateRegister(newMemberData);
    if (error?.length) return { error };

    const hashedPassword = await argon2.hash(newMemberData.password);

    const member = ctx.em.create(Member, {
      ...newMemberData,
      password: hashedPassword,
    });

    await ctx.em.persistAndFlush(member);
    // ctx.req.session.userId = member.id;
    return { member };
  }

  @Mutation(() => MemberResponse)
  async login(
    @Arg('loginInput') loginInput: LoginInput,
    @Ctx() ctx: MyContext
  ): Promise<MemberResponse> {
    const error = validateLogin(loginInput);

    if (error?.length) return { error };
    const member = await ctx.em.findOne(
      Member,
      loginInput.phoneNumber
        ? { phoneNumber: loginInput.phoneNumber }
        : { email: loginInput.email }
    );
    if (!member) {
      return {
        error: [
          {
            field: 'username or phone number',
            message: 'Member not be found. Please check your input',
          },
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
    await sendMail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
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

  @Mutation(() => Boolean)
  logout(@Ctx() ctx: MyContext) {
    return new Promise((resolve) =>
      ctx.req.session.destroy((err) => {
        ctx.res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log('logout err', err);
          resolve(false);
        }
        resolve(true);
      })
    );
  }
}

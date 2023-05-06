import { MyContext } from 'src/types';
import { Loan } from '../entities/Loan';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';

@Resolver()
export class LoanResolver {
  @Query(() => [Loan])
  async loans(@Ctx() { em }: MyContext): Promise<Loan[]> {
    const loans = await em.find(
      Loan,
      {},
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return loans;
  }
}

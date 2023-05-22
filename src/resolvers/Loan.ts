import { MyContext } from 'src/types';
import { Loan } from '../entities/Loan';
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import { loanOverdue } from '../utils/overdue';

@Resolver(Loan)
export class LoanResolver {
  @FieldResolver(() => Boolean)
  loanOverdue(@Root() root: Loan) {
    const overdueDays = loanOverdue(new Date(root.returnDate));
    return overdueDays > 0;
  }

  @Query(() => [Loan])
  async loans(@Ctx() { em }: MyContext): Promise<Loan[]> {
    const loans = await em.find(
      Loan,
      {},
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return loans;
  }

  @Query(() => [Loan])
  @UseMiddleware(isAuth)
  async loansByLenderId(
    @Arg('lenderId') lenderId: number,
    @Ctx() { em }: MyContext
  ): Promise<Loan[]> {
    const loans = await em.find(
      Loan,
      { lender: lenderId },
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return loans;
  }
}

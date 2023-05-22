import { MyContext } from '../types';
import { Reservation } from '../entities/Reservation';
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

@Resolver(Reservation)
export class ReservationResolver {
  @FieldResolver(() => Int)
  toBorrowDate(@Root() root: Reservation) {
    const reservationDate = new Date(root.createdAt);
    const currentLoanReturnDate = new Date(root.book.loans[0].returnDate);
    const daysToBorrowDate = Math.ceil(
      (currentLoanReturnDate.getTime() - reservationDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysToBorrowDate;
  }

  @Query(() => [Reservation])
  async reservations(@Ctx() { em }: MyContext): Promise<Reservation[]> {
    const reservations = await em.find(
      Reservation,
      {},
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return reservations;
  }

  @Query(() => [Reservation])
  @UseMiddleware(isAuth)
  async reservationsByLenderId(
    @Arg('lenderId') lenderId: number,
    @Ctx() { em }: MyContext
  ): Promise<Reservation[]> {
    const reservations = await em.find(
      Reservation,
      { lender: lenderId },
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return reservations;
  }
}

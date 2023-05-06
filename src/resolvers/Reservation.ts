import { MyContext } from 'src/types';
import { Reservation } from '../entities/Reservation';
import { Ctx, Query, Resolver } from 'type-graphql';

@Resolver()
export class ReservationResolver {
  @Query(() => [Reservation])
  async reservations(@Ctx() { em }: MyContext): Promise<Reservation[]> {
    const reservations = await em.find(
      Reservation,
      {},
      { populate: true, orderBy: { createdAt: 'DESC' } }
    );
    return reservations;
  }
}

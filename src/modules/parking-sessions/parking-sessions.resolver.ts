import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ParkingSessionsService } from './parking-sessions.service';
import { ParkingSession } from './types/parking-session.type';
import { ParkingSessionsArgs } from './args/parking-sessions.args';
import { CreateParkingSessionInput } from './input/create-parking-session.input';
import { GetParkingSessionsByParkingStateArgs } from './args/get-parking-sessions-by-parking-state.args';
import { PaginatedParkingSessions } from './types/paginated-parking-session.type';
import { ParkingStatistics } from './types/parking-statistics.type';
import { GetParkingStatistics } from './args/get-parking-statistics.args';
import { VehicleStats } from './types/vehicle-stats.type';
import { GetVehicleStatsArgs } from './args/get-vehicle-type.args';
import { CreateMonthlySessionInput } from './input/create-monthly-session.input';
import { GetMonthlySessionsArgs } from './args/get-monthly-sessions.args';
import { GetMonthlyTransactionsArgs } from './args/get-monthly-transactions.args';
import { GetMonthlySubscriptionAnalyticsArgs } from './args/get-monthly-subscription-analytics.args';
import { MonthlySubscriptionAnalytics } from './types/monthly-subscription-analytics.type';

@Resolver()
export class ParkingSessionsResolver {
  constructor(
    private readonly parkingSessionsService: ParkingSessionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Query(()=> PaginatedParkingSessions, { name: 'parkingSessions' })
  async getAllParkingSessions(
    @Args() args: ParkingSessionsArgs,
  ): Promise<PaginatedParkingSessions> {
    return this.parkingSessionsService.getAllParkingSessions(args);
  }

  @Mutation(() => ParkingSession, { name: 'createParkingSession' })
  async createParkingSession(
    @Args('input') input: CreateParkingSessionInput
  ) {
    const session = await this.parkingSessionsService.createParkingSession(input);

    this.eventEmitter.emit('parking.created', session);

    return session;
  }

  @Mutation(() => ParkingSession, { name: 'createMonthlySession' })
  async createMonthlySession(
    @Args('input') input: CreateMonthlySessionInput
  ) {
    const session = await this.parkingSessionsService.createMonthlySession(input);

    return session;
  }

  @Query(() => PaginatedParkingSessions, { name: 'monthlySessions' })
  async getMonthlySessions(
    @Args() args: GetMonthlySessionsArgs,
  ): Promise<PaginatedParkingSessions> {
    return this.parkingSessionsService.getMonthlySessions(args);
  }

  @Query(()=> PaginatedParkingSessions, { name: 'parkingSessionsByParkingState' })
  async getParkingSessionsByParkingState(
    @Args() args: GetParkingSessionsByParkingStateArgs
  ): Promise<PaginatedParkingSessions> {
    return this.parkingSessionsService.getParkingSessionsByParkingState(args);
  }

  @Mutation(() => ParkingSession, { name: 'exitParkingSession' })
  async exitParkingSession(
    @Args('id', { type: () => String }) id: string,
  ): Promise<ParkingSession> {
    const session = await this.parkingSessionsService.exitParkingSession(id);

    this.eventEmitter.emit('parking.exited', session);

    return session;
  }

  @Query(() => ParkingStatistics, { name: 'parkingStatistics' })
  async getParkingStatistics(
    @Args() args: GetParkingStatistics
  ): Promise<ParkingStatistics> {
    return this.parkingSessionsService.getParkingStatistics(args);
  }

  @Query(() => MonthlySubscriptionAnalytics, { name: 'monthlySubscriptionAnalytics' })
  async getMonthlySubscriptionAnalytics(
    @Args() args: GetMonthlySubscriptionAnalyticsArgs,
  ): Promise<MonthlySubscriptionAnalytics> {
    return this.parkingSessionsService.getMonthlySubscriptionAnalytics(args);
  }

  @Query(() => [ParkingSession], { name: 'monthlyTransactions' })
  async getMonthlyTransactions(
    @Args() args: GetMonthlyTransactionsArgs,
  ): Promise<ParkingSession[]> {
    return this.parkingSessionsService.getMonthlyTransactions(args);
  }

  @Query(() => [VehicleStats], { name: 'vehicleStats' })
  async getVehicleStats(
    @Args() args: GetVehicleStatsArgs
  ): Promise<VehicleStats[]> {
    return this.parkingSessionsService.getVehicleStats(args);
  }

  @Mutation(() => ParkingSession, { name: 'includeParkingSessionInBIR' })
  async includeParkingSessionInBIR(
    @Args('id', { type: () => String }) id: string,
  ): Promise<ParkingSession> {
    const session = await this.parkingSessionsService.includeParkingSessionInBIR(id);

    return session;
  }
}

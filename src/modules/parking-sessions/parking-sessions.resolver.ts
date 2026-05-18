import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/constants/role.enum';

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
import { UpdateMonthlySessionInput } from './input/update-monthly-session.input';
import { UpdateParkingSessionInput } from './input/update-parking-session.input';
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

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Mutation(() => ParkingSession, { name: 'updateMonthlySession' })
  async updateMonthlySession(
    @Args('input') input: UpdateMonthlySessionInput
  ): Promise<ParkingSession> {
    return this.parkingSessionsService.updateMonthlySession(input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Mutation(() => ParkingSession, { name: 'updateParkingSession' })
  async updateParkingSession(
    @Args('input') input: UpdateParkingSessionInput
  ): Promise<ParkingSession> {
    return this.parkingSessionsService.updateParkingSession(input);
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

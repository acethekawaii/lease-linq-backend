import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma.service';
import { ParkingSessionsArgs } from './args/parking-sessions.args';
import { CreateParkingSessionInput } from './input/create-parking-session.input';
import { ParkingState, RateType, VehicleType } from 'generated/prisma/enums';
import { GetParkingSessionsByParkingStateArgs } from './args/get-parking-sessions-by-parking-state.args';
import { PaginatedParkingSessions } from './types/paginated-parking-session.type';
import { ParkingStatistics } from './types/parking-statistics.type';
import { GetParkingStatistics } from './args/get-parking-statistics.args';
import { GetVehicleStatsArgs } from './args/get-vehicle-type.args';
import { VehicleStats } from './types/vehicle-stats.type';
import { Prisma } from 'generated/prisma/client';
import { ParkingBillingService } from './parking-billing.service';
import { CreateMonthlySessionInput } from './input/create-monthly-session.input';
import { GetMonthlySessionsArgs } from './args/get-monthly-sessions.args';
import { GetMonthlyTransactionsArgs } from './args/get-monthly-transactions.args';
import { GetMonthlySubscriptionAnalyticsArgs } from './args/get-monthly-subscription-analytics.args';
import { ParkingSession } from './types/parking-session.type';
import { MonthlySubscriptionAnalytics, MonthlySubscriptionTrendPoint } from './types/monthly-subscription-analytics.type';

@Injectable()
export class ParkingSessionsService {
  constructor(
    private prisma: PrismaService,
    private parkingBillingService: ParkingBillingService,
  ) {}

  async getAllParkingSessions(args: ParkingSessionsArgs): Promise<PaginatedParkingSessions>  {
    const { page = 1, limit = 10 } = args;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.parkingSessions.findMany({
        take: limit,
        skip: skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.parkingSessions.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };
  }

  async createParkingSession(input: CreateParkingSessionInput) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const currentDate = new Date();
    const occuranceDate = formatter.format(currentDate); 

    const newSession = await this.prisma.parkingSessions.create({
      data: {
        organizationId: "9ed47d8e-f82d-4016-a770-fc3c93563762",
        vehicleType: input.vehicleType,
        plateNumber: input.plateNumber,
        rateType: input.rateType,
        enteredAt: new Date(),
        occuranceDate,
        // discountType: input.discountType,
        // discountHolderName: input.discountHolderName,
        // discountIdNumber: input.discountIdNumber,
      },
    });

    return newSession;
  }

  async createMonthlySession(input: CreateMonthlySessionInput) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Use the monthly start date as the session's occurance date.
    const occuranceDate = formatter.format(input.monthlyStart);

    const MONTHLY_RATE = {
      [VehicleType.CAR]: 6000,
      [VehicleType.MOTORCYCLE]: 3000,
    };

    const newSession = await this.prisma.parkingSessions.create({
      data: {
        organizationId: "9ed47d8e-f82d-4016-a770-fc3c93563762",
        vehicleType: input.vehicleType,
        plateNumber: input.plateNumber,
        rateType: input.rateType,
        monthlyStart: input.monthlyStart,
        monthlyEnd: input.monthlyEnd,
        enteredAt: new Date(),
        paymentStatus: 'PAID',
        parkingFee: MONTHLY_RATE[input.vehicleType],
        occuranceDate,
      },
    });

    return newSession;
  }

  async getMonthlySessions(args: GetMonthlySessionsArgs): Promise<PaginatedParkingSessions> {
    const {
      page = 1,
      limit = 10,
      rateType = RateType.MONTHLY,
      search,
      vehicleType,
      subscriptionStatus,
      referenceDate,
      expiringWindowDays = 7,
    } = args;
    const skip = (page - 1) * limit;

    const now = referenceDate ? new Date(referenceDate) : new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const where: Prisma.ParkingSessionsWhereInput = { rateType };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    if (search && search.trim()) {
      where.plateNumber = { contains: search.trim(), mode: 'insensitive' };
    }

    if (subscriptionStatus) {
      const expiringEnd = new Date(today);
      expiringEnd.setDate(expiringEnd.getDate() + expiringWindowDays);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      switch (subscriptionStatus.toUpperCase()) {
        case 'ACTIVE':
          where.monthlyStart = { lte: today };
          where.monthlyEnd = { gte: today };
          break;
        case 'EXPIRING':
          where.monthlyEnd = { gte: today, lte: expiringEnd };
          break;
        case 'EXPIRED':
          where.monthlyEnd = { lt: today };
          break;
        case 'NEW':
          where.monthlyStart = { gte: monthStart, lt: monthEnd };
          break;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.parkingSessions.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.parkingSessions.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };
  }

  async getMonthlySubscriptionAnalytics(
    args: GetMonthlySubscriptionAnalyticsArgs,
  ): Promise<MonthlySubscriptionAnalytics> {
    const referenceDate = args.referenceDate ? new Date(args.referenceDate) : new Date();
    const trendMonths = args.trendMonths ?? 6;
    const expiringWindowDays = args.expiringWindowDays ?? 7;
    const utilizationCapacity = args.capacity ?? 100;

    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const expiringEnd = new Date(today);
    expiringEnd.setDate(expiringEnd.getDate() + expiringWindowDays);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonthLastDay = new Date(prevMonthEnd.getTime() - 1);

    const baseWhere: Prisma.ParkingSessionsWhereInput = { rateType: RateType.MONTHLY };

    const activeWhere: Prisma.ParkingSessionsWhereInput = {
      ...baseWhere,
      monthlyStart: { lte: today },
      monthlyEnd: { gte: today },
    };

    const [
      activeSubscribers,
      expiringSoon,
      expiredCount,
      newThisMonth,
      totalSubscriptions,
      activeMrrAgg,
      carsActive,
      motorcyclesActive,
      trucksActive,
      previousMonthActive,
      previousMonthNew,
      activeRenewedFromPrevMonth,
    ] = await Promise.all([
      this.prisma.parkingSessions.count({ where: activeWhere }),
      this.prisma.parkingSessions.count({
        where: { ...baseWhere, monthlyEnd: { gte: today, lte: expiringEnd } },
      }),
      this.prisma.parkingSessions.count({
        where: { ...baseWhere, monthlyEnd: { lt: today } },
      }),
      this.prisma.parkingSessions.count({
        where: { ...baseWhere, monthlyStart: { gte: monthStart, lt: monthEnd } },
      }),
      this.prisma.parkingSessions.count({ where: baseWhere }),
      this.prisma.parkingSessions.aggregate({
        where: { ...activeWhere, parkingFee: { not: null } },
        _sum: { parkingFee: true },
      }),
      this.prisma.parkingSessions.count({
        where: { ...activeWhere, vehicleType: VehicleType.CAR },
      }),
      this.prisma.parkingSessions.count({
        where: { ...activeWhere, vehicleType: VehicleType.MOTORCYCLE },
      }),
      this.prisma.parkingSessions.count({
        where: { ...activeWhere, vehicleType: VehicleType.TRUCK },
      }),
      this.prisma.parkingSessions.count({
        where: {
          ...baseWhere,
          monthlyStart: { lte: prevMonthLastDay },
          monthlyEnd: { gte: prevMonthLastDay },
        },
      }),
      this.prisma.parkingSessions.count({
        where: { ...baseWhere, monthlyStart: { gte: prevMonthStart, lt: prevMonthEnd } },
      }),
      this.prisma.parkingSessions.count({
        where: {
          ...activeWhere,
          monthlyStart: { lte: prevMonthLastDay, gte: prevMonthStart },
        },
      }),
    ]);

    const monthlyRecurringRevenue = activeMrrAgg._sum.parkingFee ?? 0;
    const averageSubscriptionValue =
      activeSubscribers > 0 ? monthlyRecurringRevenue / activeSubscribers : 0;
    const growthRate =
      previousMonthActive > 0
        ? (activeSubscribers - previousMonthActive) / previousMonthActive
        : 0;
    const retentionRate =
      previousMonthActive > 0 ? activeRenewedFromPrevMonth / previousMonthActive : 0;
    const renewalRate = previousMonthNew > 0 ? newThisMonth / previousMonthNew : 0;
    const utilizationRate =
      utilizationCapacity > 0
        ? Math.min(1, activeSubscribers / utilizationCapacity)
        : 0;

    const trend: MonthlySubscriptionTrendPoint[] = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const ms = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const me = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      const meLastInstant = new Date(me.getTime() - 1);

      const [tNew, tExpired, tActiveAtEnd, tRevAgg] = await Promise.all([
        this.prisma.parkingSessions.count({
          where: { ...baseWhere, monthlyStart: { gte: ms, lt: me } },
        }),
        this.prisma.parkingSessions.count({
          where: { ...baseWhere, monthlyEnd: { gte: ms, lt: me } },
        }),
        this.prisma.parkingSessions.count({
          where: {
            ...baseWhere,
            monthlyStart: { lte: meLastInstant },
            monthlyEnd: { gte: meLastInstant },
          },
        }),
        this.prisma.parkingSessions.aggregate({
          where: {
            ...baseWhere,
            monthlyStart: { gte: ms, lt: me },
            parkingFee: { not: null },
          },
          _sum: { parkingFee: true },
        }),
      ]);

      const label = ms.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const monthKey = `${ms.getFullYear()}-${String(ms.getMonth() + 1).padStart(2, '0')}`;

      trend.push({
        label,
        monthKey,
        newSubscribers: tNew,
        expired: tExpired,
        activeAtEnd: tActiveAtEnd,
        recurringRevenue: tRevAgg._sum.parkingFee ?? 0,
      });
    }

    return {
      activeSubscribers,
      expiringSoon,
      expired: expiredCount,
      newThisMonth,
      totalSubscriptions,
      monthlyRecurringRevenue,
      growthRate,
      retentionRate,
      renewalRate,
      previousMonthActive,
      previousMonthNew,
      averageSubscriptionValue,
      utilizationCapacity,
      utilizationRate,
      vehicleBreakdown: {
        cars: carsActive,
        motorcycles: motorcyclesActive,
        trucks: trucksActive,
      },
      trend,
    };
  }

  async getParkingSessionsByParkingState(args: GetParkingSessionsByParkingStateArgs): Promise<PaginatedParkingSessions> {
    const { page = 1, limit = 10, parkingState, date, includeInBIRReport } = args;
    const skip = (page - 1) * limit;

    const occuranceDate = date || new Date().toISOString().split('T')[0]; 

    const where: Prisma.ParkingSessionsWhereInput = {
      parkingState: parkingState,
      rateType: { not: RateType.MONTHLY },
    };

    if (date) {
      where.occuranceDate = date;
    }

    if (includeInBIRReport !== undefined) {
      where.includeInBIRReport = includeInBIRReport;
    }

    const [data, total] = await Promise.all([
      this.prisma.parkingSessions.findMany({
        where,
        // take: limit,
        // skip: skip,
        orderBy: { enteredAt: 'desc' }
      }),
      this.prisma.parkingSessions.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };
  }

  async exitParkingSession(id: string) {
    const session = await this.prisma.parkingSessions.findUnique({
      where: { id }
    });

    if (!session) {
      throw new NotFoundException('Parking session not found');
    }

    if (session.parkingState === 'EXITED') {
      throw new BadRequestException('Parking session already exited');
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const exitedAt = new Date();
    const occuranceDate = formatter.format(exitedAt); 
    const durationMinutes = Math.ceil(
      (exitedAt.getTime() - session.enteredAt.getTime()) / 60000
    );

    const parkingFee = this.parkingBillingService.calculateFee(
      session.rateType,
      session.vehicleType,
      session.enteredAt,
      exitedAt,
    )

    return this.prisma.parkingSessions.update({
      where: { id },
      data: {
        parkingState: 'EXITED',
        exitedAt,
        durationMinutes,
        parkingFee,
        paymentStatus: 'PAID',
        occuranceDate,
      },
    })
  }

  async getParkingStatistics(args: GetParkingStatistics): Promise<ParkingStatistics> {
    const baseWhere: Prisma.ParkingSessionsWhereInput = {
      parkingState: args.parkingState,
      occuranceDate: args.date,
    };


    if (args.includeInBIRReport !== undefined) {
      baseWhere.includeInBIRReport = args.includeInBIRReport;
    }

    const [parkedVehiclesCount, parkedMotorcyclesCount, currentlyParkedCount, revenueAggregate, totalEntriesTodayCount ] = await Promise.all([
      this.prisma.parkingSessions.count({
        where: {
          ...baseWhere,
          vehicleType: VehicleType.CAR,
        },
      }),

      this.prisma.parkingSessions.count({
        where: {
          ...baseWhere,
          vehicleType: VehicleType.MOTORCYCLE,
        },
      }),

      this.prisma.parkingSessions.count({
        where: {
          ...baseWhere,
        },
      }),

      this.prisma.parkingSessions.aggregate({
        where: {
          ...baseWhere,
          parkingFee: {
            not: null,
          },
        },
        _sum: {
          parkingFee: true,
        },
      }),

      this.prisma.parkingSessions.count({
        where: {
          occuranceDate: args.date,
        },
      }),
    ])

    return {
      parkedVehicles: parkedVehiclesCount,
      parkedMotorcycles: parkedMotorcyclesCount,
      revenueToday: revenueAggregate._sum.parkingFee ?? 0,
      currentlyParked: currentlyParkedCount,
      totalEntriesToday: totalEntriesTodayCount,
    };
  }

  async getVehicleStats(args: GetVehicleStatsArgs): Promise<VehicleStats[]> {
    const { date } = args;


    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [parkedVehiclesCount, parkedMotorcyclesCount] = await Promise.all([
      this.prisma.parkingSessions.count({
        where: {
          parkingState: ParkingState.EXITED,
          vehicleType: VehicleType.CAR,
          exitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      this.prisma.parkingSessions.count({
        where: {
          parkingState: ParkingState.EXITED,
          vehicleType: VehicleType.MOTORCYCLE,
          exitedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    return [
      { name: 'CAR', value: parkedVehiclesCount },
      { name: 'MOTOR', value: parkedMotorcyclesCount },
    ];
  }

  async includeParkingSessionInBIR(id: string) {
    return this.prisma.parkingSessions.update({
      where: { id },
      data: {
        includeInBIRReport: true,
      },
    })
  }

  async getMonthlyTransactions(args: GetMonthlyTransactionsArgs): Promise<ParkingSession[]> {
    const { year, month, parkingState, rateType, includeInBIRReport } = args;
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const endDate = `${nextYear}-${nextMonthStr}-01`;

    const where: Prisma.ParkingSessionsWhereInput = {
      occuranceDate: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (parkingState) {
      where.parkingState = parkingState;
    }

    if (rateType) {
      where.rateType = rateType;
    }

    if (includeInBIRReport !== undefined) {
      where.includeInBIRReport = includeInBIRReport;
    }

    return this.prisma.parkingSessions.findMany({
      where,
      orderBy: { occuranceDate: 'desc' },
    });
  }
}

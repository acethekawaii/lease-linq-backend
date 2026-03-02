import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma.service';
import { ParkingSessionsArgs } from './args/parking-sessions.args';
import { CreateParkingSessionInput } from './input/create-parking-session.input';
import { ParkingState, VehicleType } from 'generated/prisma/enums';
import { GetParkingSessionsByParkingStateArgs } from './args/get-parking-sessions-by-parking-state.args';
import { PaginatedParkingSessions } from './types/paginated-parking-session.type';
import { ParkingStatistics } from './types/parking-statistics.type';
import { GetParkingStatistics } from './args/get-parking-statistics.args';
import { GetVehicleStatsArgs } from './args/get-vehicle-type.args';
import { VehicleStats } from './types/vehicle-stats.type';
import { Prisma } from 'generated/prisma/client';
import { ParkingBillingService } from './parking-billing.service';

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

  async getParkingSessionsByParkingState(args: GetParkingSessionsByParkingStateArgs): Promise<PaginatedParkingSessions> {
    const { page = 1, limit = 10, parkingState, date, includeInBIRReport } = args;
    const skip = (page - 1) * limit;

    const occuranceDate = date || new Date().toISOString().split('T')[0]; 

    const where: Prisma.ParkingSessionsWhereInput = {
      parkingState: parkingState,
      occuranceDate: occuranceDate,
    };

    if (includeInBIRReport !== undefined) {
      where.includeInBIRReport = includeInBIRReport;
    }

    const [data, total] = await Promise.all([
      this.prisma.parkingSessions.findMany({
        where,
        // take: limit,
        // skip: skip,
        orderBy: { exitedAt: 'asc' }
      }),
      this.prisma.parkingSessions.count({
        where: {
          parkingState: parkingState,
        },
      }),
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
}

import { Module } from '@nestjs/common';
import { ParkingSessionsService } from './parking-sessions.service';
import { ParkingSessionsResolver } from './parking-sessions.resolver';
import { PrismaService } from 'src/shared/database/prisma.service';
import { ParkingBillingService } from './parking-billing.service';

@Module({
  providers: [
    ParkingSessionsResolver, 
    ParkingSessionsService,
    ParkingBillingService,
    PrismaService,
  ],
  exports: [
    PrismaService
  ]
})
export class ParkingSessionsModule {}

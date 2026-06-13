import { Module } from '@nestjs/common';
import { PrintService } from './print.service';
import { PrintController } from './print.controller';
import { PrintingListener } from './print.listener';
import { PrinterGateway } from './print.gateway';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  exports: [PrismaService],
  controllers: [PrintController],
  providers: [PrintService, PrintingListener, PrinterGateway, PrismaService],
})

export class PrintModule {}

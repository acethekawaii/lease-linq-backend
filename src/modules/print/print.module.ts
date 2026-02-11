import { Module } from '@nestjs/common';
import { PrintService } from './print.service';
import { PrintController } from './print.controller';
import { HttpModule } from '@nestjs/axios';
import { PrintingListener } from './print.listener';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 3000,
      maxRedirects: 0,
    }),
  ],
  exports: [PrismaService],
  controllers: [PrintController],
  providers: [PrintService, PrintingListener, PrismaService],
})

export class PrintModule {}

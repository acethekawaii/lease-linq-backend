import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrinterGateway } from './print.gateway';

@Injectable()
export class PrintService {
  constructor(
    private prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly printerGateway: PrinterGateway,
  ) {}

  printerStatus() {
    return this.printerGateway.statusSnapshot();
  }

  async printHelloWorld() {
    return this.printerGateway.dispatch('hello', {});
  }

  async printEntryTicket(printEntryTicketDTO: any) {
    return this.printerGateway.dispatch('entry-ticket', printEntryTicketDTO);
  }

  async printExitReceipt(printExitReceiptDTO: any) {
    return this.printerGateway.dispatch('receipt', printExitReceiptDTO);
  }

  async retryExitReceipt(sessionId: string) {
    const session = await this.prisma.parkingSessions.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException(`Parking session ${sessionId} not found`);
    }

    this.eventEmitter.emit('parking.exited', session);
  }

  async retryEntryReceipt(sessionId: string) {
    const session = await this.prisma.parkingSessions.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException(`Parking session ${sessionId} not found`);
    }

    this.eventEmitter.emit('parking.created', session);
  }
}

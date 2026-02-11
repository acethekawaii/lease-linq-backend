import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/shared/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PrintService {
  private readonly printerBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.printerBaseUrl = this.configService.get<string>('printer.baseUrl')!;
  }
  
  async printHelloWorld() {
    const res = await firstValueFrom(this.httpService.get(`${this.printerBaseUrl}/hello`));

    return res.data;
  }

  async printEntryTicket(printEntryTicketDTO: any) {
    const res = await firstValueFrom(this.httpService.post(`${this.printerBaseUrl}/entry-ticket`, printEntryTicketDTO));

    return res.data;
  }

  async printExitReceipt(printExitReceiptDTO: any) {
    const res = await firstValueFrom(this.httpService.post(`${this.printerBaseUrl}/receipt`, printExitReceiptDTO));

    return res.data;
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

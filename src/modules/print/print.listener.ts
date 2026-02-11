import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { PrintService } from './print.service';
import { formatTime } from 'src/shared/utils/date.utils';

@Injectable()
export class PrintingListener {
  private readonly logger = new Logger(PrintingListener.name);

  constructor(private readonly printService: PrintService) {}

  @OnEvent('parking.exited')
  async handleParkingExited(session: any) {
    try {
      await this.printService.printExitReceipt({
        companyName: 'Richmond Jollyland Corp.',
        companyAddress: '1722 Juan Luna St. Tondo, Manila',
        vehicleType: session.vehicleType,
        vehicleModel: session.vehicleModel,                                                                                                                                                                                                                                                                                                                               
        plateNumber: session.plateNumber,
        date: formatTime(new Date()),
        enteredAt: formatTime(session.enteredAt),
        exitedAt: formatTime(session.exitedAt),
        durationMinutes: session.durationMinutes,     
        parkingFee: session.parkingFee,
        paymentStatus: session.paymentStatus,
      });
    } catch (err) {
      this.logger.error('Exit receipt printing failed', err);
    }
  }

  @OnEvent('parking.created')
  async handleParkingCreated(session: any) {
    try {
      await this.printService.printEntryTicket({
        companyName: 'Richmond Jollyland Corp.',
        plateNumber: session.plateNumber,
        vehicleType: session.vehicleType,
        entryTime: formatTime(session.enteredAt), 
        ticketNumber: "sessionId", 
        qrCodeData: "https://i.pinimg.com/474x/ed/a8/ce/eda8ced542ccdc4cae46a813f061747e.jpg", 
        penaltyAmount: "P150.00"
      });
    } catch (err) {
      this.logger.error('Entry ticket printing failed', err);
    }
  }
}

import { Body, Controller, Get, Param, Post, UseFilters } from '@nestjs/common';
import { PrintService } from './print.service';
import { PrintExitReceiptDTO } from './dto/print.dto';
import { PrinterExceptionFilter } from 'src/common/filters/printer-exception.filter';

@UseFilters(PrinterExceptionFilter)
@Controller('print')
export class PrintController {
  constructor(private readonly printService: PrintService) { }

  @Get('hello')
  async printHelloWorld() {
    return this.printService.printHelloWorld();
  }

  @Post('entry-ticket')
  async printEntryTicket(
    @Body() printEntryTicketDTO: any
  ) {
    return this.printService.printEntryTicket(printEntryTicketDTO);
  }

  @Post('exit-receipt')
  async printExitReceipt(
    @Body() printExitReceiptDTO: PrintExitReceiptDTO
  ) {
    return this.printService.printExitReceipt(printExitReceiptDTO);
  }

  @Post('retry/exit/:sessionId')
  async retryExitPrint(
    @Param('sessionId') sessionId: string
  ) {
    return this.printService.retryExitReceipt(sessionId);
  }

  @Post('retry/entry/:sessionId')
  async retryEntryPrint(
    @Param('sessionId') sessionId: string
  ) {
    return this.printService.retryEntryReceipt(sessionId);
  }

  @Get('status')
  printerStatus() {
    return this.printService.printerStatus();
  }

  @Get('health')
  async printHealth() {
    return { status: 'health', timestamp: new Date().toISOString() };
  }
}
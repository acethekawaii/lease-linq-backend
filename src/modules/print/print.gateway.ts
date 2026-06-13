import { randomUUID } from 'node:crypto';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Server, Socket } from 'socket.io';

export type PrintJobType = 'entry-ticket' | 'receipt' | 'hello';

export interface PrintAck {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * PrinterGateway - reverses the printer connection.
 *
 * The H10S printer agent dials OUT to this gateway (role=printer) and waits for
 * jobs, so the cloud backend never needs to reach into the LAN (no ngrok).
 * The web app connects as role=client to receive live online/offline + print
 * results. Jobs are pushed to the device with a socket.io ack so the caller
 * knows whether the print actually succeeded.
 */
@WebSocketGateway({
  namespace: '/printers',
  cors: { origin: true, credentials: true },
})
export class PrinterGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PrinterGateway.name);

  /** deviceId -> socket.id of the currently connected printer agent */
  private readonly printers = new Map<string, string>();

  private static readonly ACK_TIMEOUT_MS = 15_000;

  // All room emits go through the gateway's own `/printers` namespace, captured
  // from a connecting socket (`client.nsp`), so we never depend on how Nest
  // types the injected server.
  @WebSocketServer() server: Server;
  private namespace!: Namespace;

  constructor(private readonly config: ConfigService) {}

  handleConnection(client: Socket): void {
    this.namespace = client.nsp;
    const auth = (client.handshake.auth ?? {}) as {
      role?: string;
      token?: string;
      deviceId?: string;
    };

    if (auth.role === 'printer') {
      const expected = this.config.get<string>('printer.deviceToken');
      if (expected && auth.token !== expected) {
        this.logger.warn(
          `Rejected printer '${auth.deviceId ?? '?'}': invalid token`,
        );
        client.emit('unauthorized', { message: 'invalid device token' });
        client.disconnect(true);
        return;
      }

      const deviceId = auth.deviceId || this.defaultDeviceId();
      client.data.deviceId = deviceId;
      client.join(`printer:${deviceId}`);
      this.printers.set(deviceId, client.id);
      this.logger.log(`Printer agent connected: ${deviceId}`);
      this.broadcastStatus();
      return;
    }

    // Anything else is a status subscriber (the web app).
    client.join('clients');
    client.emit('printer:status', this.statusSnapshot());
  }

  handleDisconnect(client: Socket): void {
    const deviceId: string | undefined = client.data?.deviceId;
    if (deviceId && this.printers.get(deviceId) === client.id) {
      this.printers.delete(deviceId);
      this.logger.log(`Printer agent disconnected: ${deviceId}`);
      this.broadcastStatus();
    }
  }

  /** Current connected printers, for the REST status endpoint. */
  statusSnapshot(): { online: boolean; devices: string[] } {
    const devices = [...this.printers.keys()];
    return { online: devices.length > 0, devices };
  }

  isOnline(deviceId?: string): boolean {
    return this.printers.has(deviceId || this.defaultDeviceId());
  }

  /**
   * Push a print job to a device and resolve with its ack.
   * Throws ServiceUnavailableException if the printer is offline or unresponsive.
   */
  async dispatch(
    type: PrintJobType,
    payload: unknown,
    deviceId?: string,
  ): Promise<PrintAck & { jobId: string }> {
    const target = deviceId || this.defaultDeviceId();
    const socketId = this.printers.get(target);

    if (!socketId) {
      throw new ServiceUnavailableException(
        `Printer '${target}' is offline`,
      );
    }

    const jobId = randomUUID();
    const job = { jobId, type, payload };

    try {
      const responses = await this.namespace
        .to(socketId)
        .timeout(PrinterGateway.ACK_TIMEOUT_MS)
        .emitWithAck('print:job', job);

      const ack = (responses?.[0] ?? {}) as PrintAck;
      this.namespace
        .to('clients')
        .emit('print:result', { jobId, type, ...ack });

      if (!ack.ok) {
        throw new ServiceUnavailableException(
          ack.error || 'Printer reported a failure',
        );
      }

      this.logger.log(`Print ${type} ok (job ${jobId}) -> ${target}`);
      return { jobId, ...ack };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      // emitWithAck rejects on ack timeout
      this.logger.warn(`Print ${type} timed out (job ${jobId}) -> ${target}`);
      this.namespace
        .to('clients')
        .emit('print:result', { jobId, type, ok: false, error: 'timeout' });
      throw new ServiceUnavailableException('Printer did not respond in time');
    }
  }

  private broadcastStatus(): void {
    this.namespace.to('clients').emit('printer:status', this.statusSnapshot());
  }

  private defaultDeviceId(): string {
    return this.config.get<string>('printer.defaultDeviceId') || 'default';
  }
}

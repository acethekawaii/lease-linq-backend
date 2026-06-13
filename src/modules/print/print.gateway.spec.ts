import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { PrinterGateway } from './print.gateway';

const DEVICE_TOKEN = 'test-token';
const DEVICE_ID = 'test-device';

interface ClientHandle {
  socket: Socket;
  statuses: Array<{ online: boolean; devices: string[] }>;
  results: Array<{ ok: boolean; type: string; error?: string }>;
}

/**
 * Runtime smoke test for the relay contract (no database needed).
 * Boots only the PrinterGateway, then connects a fake printer agent and a fake
 * web client over real socket.io to prove dispatch/ack/status all work.
 */
describe('PrinterGateway (relay)', () => {
  let app: INestApplication;
  let gateway: PrinterGateway;
  let url: string;
  const open: Socket[] = [];

  const config = {
    get: (key: string) =>
      key === 'printer.deviceToken'
        ? DEVICE_TOKEN
        : key === 'printer.defaultDeviceId'
          ? DEVICE_ID
          : undefined,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrinterGateway,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    gateway = moduleRef.get(PrinterGateway);
    await app.listen(0);
    url = (await app.getUrl()).replace('[::1]', 'localhost');
  });

  afterAll(async () => {
    open.forEach((s) => s.close());
    await app.close();
  });

  /** Connect and start collecting events BEFORE the handshake completes (no races). */
  const connect = (auth: Record<string, unknown>): Promise<ClientHandle> => {
    const socket = io(`${url}/printers`, {
      auth,
      transports: ['websocket'],
      forceNew: true,
    });
    open.push(socket);
    const handle: ClientHandle = { socket, statuses: [], results: [] };
    socket.on('printer:status', (s) => handle.statuses.push(s));
    socket.on('print:result', (r) => handle.results.push(r));
    return new Promise((resolve, reject) => {
      socket.on('connect', () => resolve(handle));
      socket.on('connect_error', reject);
    });
  };

  const waitUntil = async (predicate: () => boolean, ms = 5000): Promise<void> => {
    const deadline = Date.now() + ms;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error('waitUntil timed out');
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  it('rejects a printer agent with a bad token', async () => {
    const bad = io(`${url}/printers`, {
      auth: { role: 'printer', deviceId: DEVICE_ID, token: 'wrong' },
      transports: ['websocket'],
      forceNew: true,
    });
    open.push(bad);
    const reason = await new Promise<string>((resolve) =>
      bad.on('disconnect', resolve),
    );
    expect(reason).toBeDefined();
    expect(gateway.isOnline(DEVICE_ID)).toBe(false);
  });

  it('dispatches a job to the agent and resolves with its ack; clients see status + result', async () => {
    const web = await connect({ role: 'client' });
    // Snapshot on connect says offline.
    await waitUntil(() => web.statuses.length > 0);
    expect(web.statuses[0].online).toBe(false);

    const printer = await connect({
      role: 'printer',
      deviceId: DEVICE_ID,
      token: DEVICE_TOKEN,
    });
    printer.socket.on('print:job', (job, ack) =>
      ack({ ok: true, message: `printed ${job.type}` }),
    );

    // Printer connecting broadcasts online:true to the web client.
    await waitUntil(() => gateway.isOnline(DEVICE_ID));
    await waitUntil(() => web.statuses.some((s) => s.online === true));

    // Dispatch resolves with the agent's ack...
    const ack = await gateway.dispatch('entry-ticket', { plateNumber: 'ABC-123' });
    expect(ack.ok).toBe(true);
    expect(ack.message).toContain('entry-ticket');

    // ...and the web client sees the result.
    await waitUntil(() => web.results.some((r) => r.ok && r.type === 'entry-ticket'));
  }, 15000);

  it('throws when the target printer is offline', async () => {
    await expect(gateway.dispatch('hello', {}, 'nobody')).rejects.toThrow(
      /offline/i,
    );
  });
});

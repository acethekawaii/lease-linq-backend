/**
 * Fake H10S printer agent for testing the relay WITHOUT the real device.
 *
 * It dials the backend exactly like the Android agent does (role=printer),
 * then logs and acks any print job. Use it to prove the relay + frontend pill
 * end-to-end against a local OR the deployed Railway backend.
 *
 * Usage:
 *   node scripts/fake-printer-agent.mjs                       # -> http://localhost:3000
 *   node scripts/fake-printer-agent.mjs https://lease-linq-backend.up.railway.app
 *   DEVICE_ID=default DEVICE_TOKEN=secret node scripts/fake-printer-agent.mjs <url>
 *
 * Then open the web app (printer pill turns green) and hit Print, or:
 *   curl -X POST <url>/print/entry-ticket -H "Content-Type: application/json" \
 *        -d '{"plateNumber":"ABC-123","vehicleType":"CAR","entryTime":"now","ticketNumber":"1","companyName":"Test"}'
 */
import { io } from 'socket.io-client';

const URL = process.argv[2] || process.env.RELAY_URL || 'http://localhost:3000';
const deviceId = process.env.DEVICE_ID || 'default';
const token = process.env.DEVICE_TOKEN || '';

const socket = io(`${URL}/printers`, {
  transports: ['websocket'],
  auth: { role: 'printer', deviceId, token },
});

socket.on('connect', () =>
  console.log(`[agent] connected as printer '${deviceId}' -> ${URL}/printers`),
);
socket.on('unauthorized', (m) => console.error('[agent] unauthorized:', m));
socket.on('connect_error', (e) => console.error('[agent] connect_error:', e.message));
socket.on('disconnect', (r) => console.log('[agent] disconnected:', r));

socket.on('print:job', (job, ack) => {
  console.log(`\n[agent] PRINT ${job.type}  (job ${job.jobId})`);
  console.dir(job.payload, { depth: null });
  // Pretend the thermal head succeeded.
  if (typeof ack === 'function') ack({ ok: true, message: `printed ${job.type}` });
});

console.log(`[agent] connecting to ${URL}/printers ...`);

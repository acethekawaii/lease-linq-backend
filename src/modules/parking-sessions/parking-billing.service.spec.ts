import { ParkingBillingService } from './parking-billing.service';

describe('ParkingBillingService', () => {
  let service: ParkingBillingService;

  beforeEach(() => {
    service = new ParkingBillingService();
  });

  it('charges overnight + extra hour after 7am Manila for 23:00 -> 08:00', () => {
    const enteredAt = new Date('2026-03-01T15:00:00.000Z'); // Manila 23:00
    const exitedAt = new Date('2026-03-02T00:00:00.000Z'); // Manila 08:00

    const fee = service.calculateFee('OVERNIGHT', 'CAR', enteredAt, exitedAt);

    expect(fee).toBe(225);
  });

  it('charges only overnight up to 7am Manila for 23:00 -> 07:00', () => {
    const enteredAt = new Date('2026-03-01T15:00:00.000Z');
    const exitedAt = new Date('2026-03-01T23:00:00.000Z'); // Manila 07:00

    const fee = service.calculateFee('OVERNIGHT', 'CAR', enteredAt, exitedAt);

    expect(fee).toBe(200);
  });
});

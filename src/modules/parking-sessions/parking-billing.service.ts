import { Injectable } from "@nestjs/common";
import { RateType, VehicleType } from "generated/prisma/enums";

@Injectable()
export class ParkingBillingService {
  private RATE_PER_HOUR = {
    [VehicleType.CAR]: 25,
    [VehicleType.MOTORCYCLE]: 20,
    [VehicleType.TRUCK]: 100,
  };

  private OVERNIGHT_RATE = {
    [VehicleType.CAR]: 200,
    [VehicleType.MOTORCYCLE]: 150,
    [VehicleType.TRUCK]: 300,
  }
  
  computeHourly(vehicleType: VehicleType, durationMinutes: number) {
    const ratePerHour = this.RATE_PER_HOUR[vehicleType];
    const hours = Math.ceil(durationMinutes / 60);
    return ratePerHour * hours;
  }

  computeOvernight(
    vehicleType: VehicleType,
    enteredAt: Date,
    exitedAt: Date
  ) {
    const overnightRate = this.OVERNIGHT_RATE[vehicleType];
    const hourlyRate = this.RATE_PER_HOUR[vehicleType];

    const manilaDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(enteredAt);

    const overnightEndMs = Date.parse(`${manilaDate}T07:00:00+08:00`) + 24 * 60 * 60 * 1000;

    let fee = overnightRate;

    if (exitedAt.getTime() > overnightEndMs) {
      const excessMs = exitedAt.getTime() - overnightEndMs;
      const excessHours = Math.ceil(excessMs / (1000 * 60 * 60));
      fee += excessHours * hourlyRate;
    }

    return fee;
  }

  calculateFee(rateType: RateType, vehicleType: VehicleType, enteredAt: Date, exitedAt: Date) {
    const durationMinutes = Math.ceil(
      (exitedAt.getTime() - enteredAt.getTime()) / 60000
    );

    if (rateType === 'OVERNIGHT') {
      return this.computeOvernight(vehicleType, enteredAt, exitedAt);
    }

    return this.computeHourly(vehicleType, durationMinutes);
  }
}
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

    const overnightEnd = new Date(enteredAt);
    overnightEnd.setDate(overnightEnd.getDate() + 1);
    overnightEnd.setHours(7, 0, 0, 0);

    let fee = overnightRate;

    if (exitedAt > overnightEnd) {
      const excessMs = exitedAt.getTime() - overnightEnd.getTime();
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
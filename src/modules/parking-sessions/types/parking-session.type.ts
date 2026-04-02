import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';

import { RateType, VehicleType, ParkingState, PaymentStatus } from 'generated/prisma/enums';

registerEnumType(VehicleType, {
  name: 'VehicleType'
});

registerEnumType(ParkingState, {
  name: 'ParkingState'
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus'
});

registerEnumType(RateType, {
  name: 'RateType',
});

@ObjectType()
export class ParkingSession {
  @Field()
  id: string;
  
  @Field(() => VehicleType)
  vehicleType: VehicleType;
  
  @Field(() => String, { nullable: true })
  vehicleModel?: string | null;
  
  @Field()
  plateNumber: string;

  @Field(() => Date)
  enteredAt: Date;

  @Field(() => Date, { nullable: true })
  exitedAt?: Date | null;

  @Field(() => Int, { nullable: true })
  durationMinutes?: number | null;

  @Field(() => Int, { nullable: true })
  parkingCredits?: number | null;

  @Field(() => RateType, { defaultValue: RateType.HOURLY })
  rateType: RateType;

  @Field()
  occuranceDate: string;

  @Field(() => Date, { nullable: true })
  monthlyStart?: Date | null;

  @Field(() => Date, { nullable: true })
  monthlyEnd?: Date | null;

  @Field(() => Float, { nullable: true })
  parkingFee?: number | null;

  @Field(() => ParkingState, { defaultValue: ParkingState.ACTIVE })
  parkingState: ParkingState;

  @Field(() => PaymentStatus, { defaultValue: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Field(() => String, { nullable: true })
  guardRemarks?: string | null;

  @Field(() => Boolean)
  includeInBIRReport: boolean;
}
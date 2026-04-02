import { ArgsType, Field, Int } from '@nestjs/graphql';
import { ParkingState, RateType } from 'generated/prisma/enums';

@ArgsType()
export class GetMonthlyTransactionsArgs {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => ParkingState, { nullable: true })
  parkingState?: ParkingState;

  @Field(() => RateType, { nullable: true })
  rateType?: RateType;

  @Field(() => Boolean, { nullable: true })
  includeInBIRReport?: boolean;
}
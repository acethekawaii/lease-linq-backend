import { ArgsType, Field } from "@nestjs/graphql";
import { ParkingState } from "generated/prisma/enums";

@ArgsType()
export class GetParkingStatistics {
  @Field()
  parkingState: ParkingState;

  @Field()
  date: string;

  @Field(() => Boolean, { nullable: true })
  includeInBIRReport?: boolean;
}
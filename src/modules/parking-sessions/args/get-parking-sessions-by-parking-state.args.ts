import { ArgsType, Field } from "@nestjs/graphql";
import { ParkingState } from "generated/prisma/enums";
import { PaginationArgs } from "src/common/args/pagination.args";

@ArgsType()
export class GetParkingSessionsByParkingStateArgs extends PaginationArgs {
  @Field()
  parkingState: ParkingState;

  @Field({ nullable: true })
  date?: string;

  @Field(() => Boolean, { nullable: true })
  includeInBIRReport?: boolean;
}
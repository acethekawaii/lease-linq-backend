import { ArgsType, Field, Int } from "@nestjs/graphql";
import { RateType, VehicleType } from "generated/prisma/enums";
import { PaginationArgs } from "src/common/args/pagination.args";

@ArgsType()
export class GetMonthlySessionsArgs extends PaginationArgs {
  @Field()
  rateType: RateType;

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => VehicleType, { nullable: true })
  vehicleType?: VehicleType;

  @Field(() => String, { nullable: true })
  subscriptionStatus?: string;

  @Field(() => String, { nullable: true })
  referenceDate?: string;

  @Field(() => Int, { nullable: true, defaultValue: 7 })
  expiringWindowDays?: number;
}

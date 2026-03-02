import { ArgsType, Field } from "@nestjs/graphql";
import { RateType } from "generated/prisma/enums";
import { PaginationArgs } from "src/common/args/pagination.args";

@ArgsType()
export class GetMonthlySessionsArgs extends PaginationArgs {
  @Field()
  rateType: RateType;
}
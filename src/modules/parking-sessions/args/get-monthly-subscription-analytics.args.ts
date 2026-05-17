import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class GetMonthlySubscriptionAnalyticsArgs {
  @Field(() => String, { nullable: true })
  referenceDate?: string;

  @Field(() => Int, { nullable: true, defaultValue: 6 })
  trendMonths?: number;

  @Field(() => Int, { nullable: true, defaultValue: 7 })
  expiringWindowDays?: number;

  @Field(() => Int, { nullable: true })
  capacity?: number;
}

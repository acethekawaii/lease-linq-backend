import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MonthlySubscriptionTrendPoint {
  @Field()
  label: string;

  @Field()
  monthKey: string;

  @Field(() => Int)
  newSubscribers: number;

  @Field(() => Int)
  expired: number;

  @Field(() => Int)
  activeAtEnd: number;

  @Field(() => Float)
  recurringRevenue: number;
}

@ObjectType()
export class VehicleBreakdown {
  @Field(() => Int)
  cars: number;

  @Field(() => Int)
  motorcycles: number;

  @Field(() => Int)
  trucks: number;
}

@ObjectType()
export class MonthlySubscriptionAnalytics {
  @Field(() => Int)
  activeSubscribers: number;

  @Field(() => Int)
  expiringSoon: number;

  @Field(() => Int)
  expired: number;

  @Field(() => Int)
  newThisMonth: number;

  @Field(() => Int)
  totalSubscriptions: number;

  @Field(() => Float)
  monthlyRecurringRevenue: number;

  @Field(() => Float)
  growthRate: number;

  @Field(() => Float)
  retentionRate: number;

  @Field(() => Float)
  renewalRate: number;

  @Field(() => Int)
  previousMonthActive: number;

  @Field(() => Int)
  previousMonthNew: number;

  @Field(() => Float)
  averageSubscriptionValue: number;

  @Field(() => Int)
  utilizationCapacity: number;

  @Field(() => Float)
  utilizationRate: number;

  @Field(() => VehicleBreakdown)
  vehicleBreakdown: VehicleBreakdown;

  @Field(() => [MonthlySubscriptionTrendPoint])
  trend: MonthlySubscriptionTrendPoint[];
}

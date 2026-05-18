import { Field, Float, ID, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateMonthlySessionInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field({ nullable: true })
  monthlyStart?: Date;

  @Field({ nullable: true })
  monthlyEnd?: Date;

  @Field(() => Float, { nullable: true })
  parkingFee?: number;
}

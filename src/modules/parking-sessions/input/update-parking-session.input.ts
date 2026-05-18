import { Field, Float, ID, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateParkingSessionInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field({ nullable: true })
  enteredAt?: Date;

  @Field({ nullable: true })
  exitedAt?: Date;

  @Field(() => Float, { nullable: true })
  parkingFee?: number;
}

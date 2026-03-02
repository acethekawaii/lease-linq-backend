import { Field, InputType } from "@nestjs/graphql";
import { CreateParkingSessionInput } from "./create-parking-session.input";

@InputType()
export class CreateMonthlySessionInput extends CreateParkingSessionInput {
  @Field()
  monthlyStart: Date;

  @Field()
  monthlyEnd: Date;
}
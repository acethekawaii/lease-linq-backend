import { Field, InputType } from "@nestjs/graphql";
import { DiscountType, RateType, VehicleType } from "generated/prisma/enums";

@InputType()
export class CreateParkingSessionInput {
  @Field()
  vehicleType: VehicleType;

  @Field()
  plateNumber: string;

  @Field()
  rateType: RateType;

  // @Field()
  // discountType: DiscountType;

  // @Field()
  // discountHolderName: string;

  // @Field()
  // discountIdNumber: string;
}
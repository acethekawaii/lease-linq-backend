import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ParkingSession } from './parking-session.type';
import { PaginationMeta } from 'src/shared/types/pagination-meta.type';

@ObjectType()
export class PaginatedParkingSessions {
  @Field(() => [ParkingSession])
  data: ParkingSession[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}
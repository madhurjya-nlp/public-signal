import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { INTEREST_CATEGORIES } from '../../../common/public-signal/categories';

export class UpdateInterestsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @IsIn(INTEREST_CATEGORIES, { each: true })
  interests!: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  suppressedTopics!: string[];
}

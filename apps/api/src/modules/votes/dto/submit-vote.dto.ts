import { IsIn, IsUUID } from 'class-validator';
import { VOTE_TYPES } from '../../../common/public-signal/votes';

export class SubmitVoteDto {
  @IsUUID()
  article_id!: string;

  @IsIn(VOTE_TYPES)
  vote_type!: string;
}


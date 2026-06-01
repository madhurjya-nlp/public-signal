import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { VotesService } from './votes.service';

@Controller({ path: 'votes', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post()
  submitVote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitVoteDto,
  ) {
    return this.votes.submitVote(user.id, dto);
  }
}


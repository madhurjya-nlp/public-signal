import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { RankingsService } from './rankings.service';

@Controller({ path: 'rankings', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class RankingsController {
  constructor(private readonly rankings: RankingsService) {}

  @Get('daily')
  getDaily(
    @CurrentUser() user: AuthenticatedUser,
    @Query('scope') scope?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rankings.getDailyRankings({
      userId: user.id,
      scope,
      limit,
    });
  }
}

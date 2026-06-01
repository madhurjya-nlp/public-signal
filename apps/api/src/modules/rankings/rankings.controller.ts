import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { RankingsService } from './rankings.service';

@Controller({ path: 'rankings', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class RankingsController {
  constructor(private readonly rankings: RankingsService) {}

  @Get('daily')
  getDaily() {
    return this.rankings.getDailyRankings();
  }
}


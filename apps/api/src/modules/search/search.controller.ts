import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { SearchService } from './search.service';

@Controller({ path: 'search', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @Get()
  searchAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query: string,
  ) {
    return this.search.searchAll(user.id, query);
  }
}

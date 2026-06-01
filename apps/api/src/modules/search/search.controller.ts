import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { SearchService } from './search.service';

@Controller({ path: 'search', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  searchAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') query: string,
  ) {
    return this.search.searchAll(user.id, query);
  }
}


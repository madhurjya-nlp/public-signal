import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { FeedService } from './feed.service';

@Controller({ path: 'feed', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.feed.getToday(user.id);
  }
}


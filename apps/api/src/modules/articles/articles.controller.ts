import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { ArticlesService } from './articles.service';

@Controller({ path: 'articles', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get('feed')
  getFeed(@CurrentUser() user: AuthenticatedUser) {
    return this.articles.getFeed(user.id);
  }

  @Throttle({
    default: {
      limit: 2,
      ttl: 60_000,
    },
  })
  @Post('ingest')
  ingest(@CurrentUser() user: AuthenticatedUser) {
    return this.articles.triggerManualIngestion(user.id);
  }

  @Get(':id')
  getArticle(@Param('id', ParseUUIDPipe) id: string) {
    return this.articles.getArticle(id);
  }
}

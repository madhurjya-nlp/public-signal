import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/authenticated-user.decorator';
import { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { UserActionsService } from './user-actions.service';

@Controller({ path: 'articles', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class ArticleActionsController {
  constructor(private readonly actions: UserActionsService) {}

  @Post(':articleId/save')
  saveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.actions.saveArticle(user.id, articleId);
  }

  @Delete(':articleId/save')
  unsaveArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.actions.unsaveArticle(user.id, articleId);
  }

  @Post(':articleId/skip')
  skipArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.actions.skipArticle(user.id, articleId);
  }
}

@Controller({ path: 'me', version: '1' })
@UseGuards(SupabaseAuthGuard)
export class MeActionsController {
  constructor(private readonly actions: UserActionsService) {}

  @Get('saved-articles')
  getSavedArticles(@CurrentUser() user: AuthenticatedUser) {
    return this.actions.getSavedArticles(user.id);
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.actions.getAnalytics(user.id);
  }

  @Get('voted-articles')
  getVotedArticles(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vote_type') voteType?: string,
  ) {
    return this.actions.getVotedArticles(user.id, voteType);
  }

  @Get('skipped-articles')
  getSkippedArticles(@CurrentUser() user: AuthenticatedUser) {
    return this.actions.getSkippedArticles(user.id);
  }
}

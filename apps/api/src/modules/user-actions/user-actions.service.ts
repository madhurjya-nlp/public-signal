import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isVoteType, VoteType } from '../../common/public-signal/votes';
import { ArticlesRepository } from '../articles/articles.repository';
import { StoriesRepository } from '../stories/stories.repository';
import { UsersRepository } from '../users/users.repository';
import { UserActionsRepository } from './user-actions.repository';

@Injectable()
export class UserActionsService {
  constructor(
    private readonly actions: UserActionsRepository,
    private readonly articles: ArticlesRepository,
    private readonly stories: StoriesRepository,
    private readonly users: UsersRepository,
  ) {}

  async saveArticle(userId: string, articleId: string) {
    await this.ensureUserAndArticle(userId, articleId);
    await this.actions.saveArticle({
      userId,
      articleId,
      storyGroupId: await this.stories.findLinkByArticleId(articleId),
    });

    return { article_id: articleId, saved: true };
  }

  async unsaveArticle(userId: string, articleId: string) {
    await this.users.getProfile(userId);
    await this.actions.unsaveArticle(userId, articleId);

    return { article_id: articleId, saved: false };
  }

  async skipArticle(userId: string, articleId: string) {
    await this.ensureUserAndArticle(userId, articleId);
    await this.actions.skipArticle({
      userId,
      articleId,
      storyGroupId: await this.stories.findLinkByArticleId(articleId),
    });

    return { article_id: articleId, skipped: true };
  }

  async getSavedArticles(userId: string) {
    await this.users.getProfile(userId);
    return this.actions.findSavedArticles(userId);
  }

  async getAnalytics(userId: string) {
    await this.users.getProfile(userId);
    return this.actions.getAnalytics(userId);
  }

  async getVotedArticles(userId: string, voteType?: string) {
    await this.users.getProfile(userId);
    let validatedVoteType: VoteType | undefined;

    if (voteType && !isVoteType(voteType)) {
      throw new BadRequestException('Invalid vote_type');
    }
    if (voteType) {
      validatedVoteType = voteType as VoteType;
    }

    return this.actions.findVotedArticles(userId, validatedVoteType);
  }

  async getSkippedArticles(userId: string) {
    await this.users.getProfile(userId);
    return this.actions.findSkippedArticles(userId);
  }

  private async ensureUserAndArticle(userId: string, articleId: string) {
    await this.users.getProfile(userId);
    const exists = await this.articles.exists(articleId);

    if (!exists) {
      throw new NotFoundException('Article not found');
    }
  }
}

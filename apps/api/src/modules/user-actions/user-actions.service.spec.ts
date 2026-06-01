import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserActionsService } from './user-actions.service';

const userId = '10000000-0000-0000-0000-000000000001';
const articleId = '20000000-0000-0000-0000-000000000001';
const storyGroupId = '30000000-0000-0000-0000-000000000001';

describe('UserActionsService', () => {
  it('saves an article idempotently through the action repository', async () => {
    const { service, actions } = createService();

    await expect(service.saveArticle(userId, articleId)).resolves.toEqual({
      article_id: articleId,
      saved: true,
    });
    expect(actions.saveArticle).toHaveBeenCalledWith({
      userId,
      articleId,
      storyGroupId,
    });
  });

  it('unsaves an article idempotently', async () => {
    const { service, actions } = createService();

    await expect(service.unsaveArticle(userId, articleId)).resolves.toEqual({
      article_id: articleId,
      saved: false,
    });
    expect(actions.unsaveArticle).toHaveBeenCalledWith(userId, articleId);
  });

  it('creates a skip without creating a vote', async () => {
    const { service, actions } = createService();

    await expect(service.skipArticle(userId, articleId)).resolves.toEqual({
      article_id: articleId,
      skipped: true,
    });
    expect(actions.skipArticle).toHaveBeenCalledWith({
      userId,
      articleId,
      storyGroupId,
    });
  });

  it('rejects save for a missing article', async () => {
    const { service } = createService({ articleExists: false });

    await expect(service.saveArticle(userId, articleId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns analytics from repository', async () => {
    const { service } = createService();

    await expect(service.getAnalytics(userId)).resolves.toEqual({
      total_votes: 1,
      critical_votes: 1,
      worth_knowing_votes: 0,
      not_important_votes: 0,
      skipped_articles: 1,
      saved_articles: 1,
      unique_sources_voted: 1,
      unique_story_groups_voted: 1,
      top_interests: [{ interest: 'environment', votes: 1 }],
      recent_activity: [],
    });
  });

  it('filters voted article details by validated vote type', async () => {
    const { service, actions } = createService();

    await expect(service.getVotedArticles(userId, 'critical')).resolves.toEqual({
      items: [],
    });
    expect(actions.findVotedArticles).toHaveBeenCalledWith(userId, 'critical');
  });

  it('rejects invalid voted article detail filter', async () => {
    const { service } = createService();

    await expect(
      service.getVotedArticles(userId, 'skip'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns skipped article details for the current user', async () => {
    const { service, actions } = createService();

    await expect(service.getSkippedArticles(userId)).resolves.toEqual({
      items: [],
    });
    expect(actions.findSkippedArticles).toHaveBeenCalledWith(userId);
  });
});

function createService(options: { articleExists?: boolean } = {}) {
  const actions = {
    saveArticle: jest.fn().mockResolvedValue(undefined),
    unsaveArticle: jest.fn().mockResolvedValue(undefined),
    skipArticle: jest.fn().mockResolvedValue(undefined),
    findSavedArticles: jest.fn().mockResolvedValue({ items: [] }),
    findVotedArticles: jest.fn().mockResolvedValue({ items: [] }),
    findSkippedArticles: jest.fn().mockResolvedValue({ items: [] }),
    getAnalytics: jest.fn().mockResolvedValue({
      total_votes: 1,
      critical_votes: 1,
      worth_knowing_votes: 0,
      not_important_votes: 0,
      skipped_articles: 1,
      saved_articles: 1,
      unique_sources_voted: 1,
      unique_story_groups_voted: 1,
      top_interests: [{ interest: 'environment', votes: 1 }],
      recent_activity: [],
    }),
  };
  const articles = {
    exists: jest.fn().mockResolvedValue(options.articleExists ?? true),
  };
  const stories = {
    findLinkByArticleId: jest.fn().mockResolvedValue(storyGroupId),
  };
  const users = {
    getProfile: jest.fn().mockResolvedValue({ id: userId, interests: [] }),
  };

  return {
    actions,
    service: new UserActionsService(
      actions as never,
      articles as never,
      stories as never,
      users as never,
    ),
  };
}

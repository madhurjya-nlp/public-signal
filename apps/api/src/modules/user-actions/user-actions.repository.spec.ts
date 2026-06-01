import { UserActionsRepository } from './user-actions.repository';

const userId = '10000000-0000-0000-0000-000000000001';
const articleId = '20000000-0000-0000-0000-000000000001';
const article = {
  id: articleId,
  title: 'Public signal detail',
  url: 'https://example.com/detail',
  source: 'Example Source',
  thumbnail_url: null,
  published_at: null,
  summary: null,
  categories: ['environment'],
  created_at: '2026-06-02T00:00:00.000Z',
  story_group_id: null,
  story_title: 'Public signal detail',
  related_sources: [{ source: 'Example Source', url: 'https://example.com/detail' }],
};

describe('UserActionsRepository', () => {
  it('returns only the current user voted rows and applies vote_type filter', async () => {
    const { repository, eq } = createRepository([
      {
        article_id: articleId,
        vote_type: 'critical',
        created_at: '2026-06-02T00:00:00.000Z',
      },
    ]);
    jest
      .spyOn(repository as never, 'findArticlesMap' as never)
      .mockResolvedValue(new Map([[articleId, article]]) as never);

    const result = await repository.findVotedArticles(userId, 'critical');

    expect(eq).toHaveBeenCalledWith('user_id', userId);
    expect(eq).toHaveBeenCalledWith('vote_type', 'critical');
    expect(result.items[0]).toEqual(
      expect.objectContaining({ article, vote_type: 'critical' }),
    );
  });

  it('returns only the current user skipped rows', async () => {
    const { repository, eq } = createRepository([
      {
        article_id: articleId,
        created_at: '2026-06-02T00:00:00.000Z',
      },
    ]);
    jest
      .spyOn(repository as never, 'findArticlesMap' as never)
      .mockResolvedValue(new Map([[articleId, article]]) as never);

    const result = await repository.findSkippedArticles(userId);

    expect(eq).toHaveBeenCalledWith('user_id', userId);
    expect(result.items[0]).toEqual(
      expect.objectContaining({ article, skipped_at: '2026-06-02T00:00:00.000Z' }),
    );
  });

  it('returns saved article categories and saved_at for notebook grouping', async () => {
    const { repository, eq } = createRepository([
      {
        article_id: articleId,
        story_group_id: null,
        created_at: '2026-06-02T00:00:00.000Z',
      },
    ]);
    jest
      .spyOn(repository as never, 'findArticlesByIds' as never)
      .mockResolvedValue([article] as never);

    const result = await repository.findSavedArticles(userId);

    expect(eq).toHaveBeenCalledWith('user_id', userId);
    expect(result.items[0]).toEqual({
      article,
      saved_at: '2026-06-02T00:00:00.000Z',
    });
    expect(result.items[0].article.categories).toEqual(['environment']);
  });
});

function createRepository(rows: unknown[]) {
  const eq = jest.fn().mockReturnThis();
  const query = {
    select: jest.fn().mockReturnThis(),
    eq,
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    returns: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
  const repository = new UserActionsRepository(
    { admin: { from: jest.fn().mockReturnValue(query) } } as never,
    {} as never,
  );

  return { repository, eq };
}

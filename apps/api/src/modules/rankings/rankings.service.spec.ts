import { RankingsService } from './rankings.service';

const article = {
  id: '00000000-0000-0000-0000-000000000001',
  headline: 'Important article',
  canonical_url: 'https://example.com/important',
  thumbnail_url: null,
  published_at: '2026-06-01T00:00:00.000Z',
  summary: 'Summary',
  categories: ['technology'],
  created_at: '2026-06-01T00:00:00.000Z',
  source: { name: 'Example Source' },
};

describe('RankingsService', () => {
  it('calculates important, ignored, and divisive rankings', async () => {
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        { vote_type: 'critical', article },
        { vote_type: 'worth_knowing', article },
        {
          vote_type: 'not_important',
          article: {
            ...article,
            id: '00000000-0000-0000-0000-000000000002',
            headline: 'Ignored article',
            canonical_url: 'https://example.com/ignored',
          },
        },
        {
          vote_type: 'critical',
          article: {
            ...article,
            id: '00000000-0000-0000-0000-000000000003',
            headline: 'Divisive article',
            canonical_url: 'https://example.com/divisive',
          },
        },
        {
          vote_type: 'not_important',
          article: {
            ...article,
            id: '00000000-0000-0000-0000-000000000003',
            headline: 'Divisive article',
            canonical_url: 'https://example.com/divisive',
          },
        },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    const result = await service.getDailyRankings();

    expect(result.most_important[0].rankingScore).toBe(4);
    expect(result.most_ignored[0].rankingScore).toBe(-1);
    expect(result.most_divisive[0].title).toBe('Divisive article');
  });

  it('returns empty arrays when there are no votes', async () => {
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    await expect(service.getDailyRankings()).resolves.toEqual({
      most_important: [],
      most_ignored: [],
      most_divisive: [],
    });
  });

  it('aggregates article-level votes into one story-group ranking', async () => {
    const secondArticle = {
      ...article,
      id: '00000000-0000-0000-0000-000000000002',
      headline: 'Important article from another source',
      canonical_url: 'https://example.com/important-second',
      source: { name: 'Second Source' },
    };
    const storyMetadata = {
      storyGroupId: '30000000-0000-0000-0000-000000000001',
      storyTitle: 'Grouped important story',
      representativeArticleId: article.id,
      relatedSources: [
        { source: 'Example Source', url: article.canonical_url },
        { source: 'Second Source', url: secondArticle.canonical_url },
      ],
    };
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        { vote_type: 'critical', article },
        { vote_type: 'worth_knowing', article: secondArticle },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(
        new Map([
          [article.id, storyMetadata],
          [secondArticle.id, storyMetadata],
        ]),
      ),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    const result = await service.getDailyRankings();

    expect(result.most_important).toHaveLength(1);
    expect(result.most_important[0]).toEqual(
      expect.objectContaining({
        story_group_id: storyMetadata.storyGroupId,
        title: 'Grouped important story',
        rankingScore: 4,
        totalVotes: 2,
        representative_source: 'Example Source',
        representative_url: article.canonical_url,
        voteCounts: {
          critical: 1,
          worthKnowing: 1,
          notImportant: 0,
        },
      }),
    );
  });

  it('applies limit per ranking section', async () => {
    const votes = Array.from({ length: 12 }, (_, index) => ({
      vote_type: 'critical',
      article: {
        ...article,
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
        headline: `Important article ${index + 1}`,
        canonical_url: `https://example.com/important-${index + 1}`,
      },
    }));
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue(votes),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    const result = await service.getDailyRankings({ limit: '3' });

    expect(result.most_important).toHaveLength(3);
  });

  it('includes representative and thumbnail display fields', async () => {
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        {
          vote_type: 'critical',
          article: {
            ...article,
            thumbnail_url: 'https://example.com/thumb.jpg',
          },
        },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    const result = await service.getDailyRankings();

    expect(result.most_important[0]).toEqual(
      expect.objectContaining({
        thumbnail_url: 'https://example.com/thumb.jpg',
        representative_article_id: article.id,
        representative_source: 'Example Source',
        representative_url: article.canonical_url,
        latest_published_at: article.published_at,
      }),
    );
  });

  it('uses the first available story-group thumbnail fallback', async () => {
    const storyMetadata = {
      storyGroupId: '30000000-0000-0000-0000-000000000001',
      storyTitle: 'Grouped important story',
      representativeArticleId: article.id,
      representativeSource: 'Example Source',
      representativeUrl: article.canonical_url,
      storyThumbnailUrl: 'https://example.com/group-thumb.jpg',
      latestPublishedAt: article.published_at,
      relatedSources: [{ source: 'Example Source', url: article.canonical_url }],
    };
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        { vote_type: 'critical', article },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(
        new Map([[article.id, storyMetadata]]),
      ),
    } as never, {
      getProfile: jest.fn(),
    } as never);

    const result = await service.getDailyRankings();

    expect(result.most_important[0].thumbnail_url).toBe(
      'https://example.com/group-thumb.jpg',
    );
  });

  it('filters personalized rankings by current user interests', async () => {
    const environmentArticle = {
      ...article,
      id: '00000000-0000-0000-0000-000000000004',
      headline: 'Environment article',
      canonical_url: 'https://example.com/environment',
      categories: ['environment'],
    };
    const businessArticle = {
      ...article,
      id: '00000000-0000-0000-0000-000000000005',
      headline: 'Business article',
      canonical_url: 'https://example.com/business',
      categories: ['business'],
    };
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        { vote_type: 'critical', article: environmentArticle },
        { vote_type: 'critical', article: businessArticle },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn().mockResolvedValue({ interests: ['environment'] }),
    } as never);

    const result = await service.getDailyRankings({
      userId: '10000000-0000-0000-0000-000000000001',
      scope: 'my_interests',
    });

    expect(result.most_important).toHaveLength(1);
    expect(result.most_important[0].title).toBe('Environment article');
  });

  it('falls back to global rankings when user has no interests', async () => {
    const service = new RankingsService({
      findVotesBetween: jest.fn().mockResolvedValue([
        { vote_type: 'critical', article },
      ]),
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(new Map()),
    } as never, {
      getProfile: jest.fn().mockResolvedValue({ interests: [] }),
    } as never);

    const result = await service.getDailyRankings({
      userId: '10000000-0000-0000-0000-000000000001',
      scope: 'my_interests',
    });

    expect(result.most_important).toHaveLength(1);
  });
});

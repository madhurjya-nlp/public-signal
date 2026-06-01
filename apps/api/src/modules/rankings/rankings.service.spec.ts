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
    } as never);

    const result = await service.getDailyRankings();

    expect(result.most_important).toHaveLength(1);
    expect(result.most_important[0]).toEqual(
      expect.objectContaining({
        story_group_id: storyMetadata.storyGroupId,
        title: 'Grouped important story',
        rankingScore: 4,
        totalVotes: 2,
        voteCounts: {
          critical: 1,
          worthKnowing: 1,
          notImportant: 0,
        },
      }),
    );
  });
});

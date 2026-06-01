import { ArticlesRepository } from './articles.repository';

const articleRow = {
  id: '20000000-0000-0000-0000-000000000001',
  headline: 'Public signal headline',
  canonical_url: 'https://example.com/story',
  thumbnail_url: null,
  published_at: '2026-06-01T00:00:00.000Z',
  summary: 'Summary',
  categories: ['technology'],
  created_at: '2026-06-01T00:00:00.000Z',
  source: { name: 'Example Source' },
  enrichment: null,
};

describe('ArticlesRepository', () => {
  it('maps feed rows with database UUID as article id', async () => {
    const repository = new ArticlesRepository({
      admin: {
        from: jest.fn((table: string) => {
          if (table === 'article_votes') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              returns: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }

          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            returns: jest.fn().mockResolvedValue({
              data: [articleRow],
              error: null,
            }),
          };
        }),
      },
    } as never);

    const items = await repository.findFeedForUser({
      userId: '10000000-0000-0000-0000-000000000001',
      interests: ['technology'],
    });

    expect(items[0]).toEqual({
      id: '20000000-0000-0000-0000-000000000001',
      title: 'Public signal headline',
      url: 'https://example.com/story',
      source: 'Example Source',
      thumbnail_url: null,
      published_at: '2026-06-01T00:00:00.000Z',
      summary: 'Summary',
      categories: ['technology'],
      created_at: '2026-06-01T00:00:00.000Z',
    });
  });

  it('upserts ingested articles by canonical URL and lets the database create UUID ids', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const sourceSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: '10000000-0000-0000-0000-000000000001' }, error: null });

    const repository = new ArticlesRepository({
      admin: {
        from: jest.fn((table: string) => {
          if (table === 'sources') {
            return {
              upsert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: sourceSingle,
            };
          }

          return { upsert };
        }),
      },
    } as never);

    await repository.upsertIngestedArticle({
      title: 'Ingested headline',
      url: 'https://example.com/ingested',
      sourceName: 'Example Source',
      thumbnailUrl: null,
      publishedAt: null,
      summary: 'Summary',
      categories: ['technology'],
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_id: '10000000-0000-0000-0000-000000000001',
        headline: 'Ingested headline',
        canonical_url: 'https://example.com/ingested',
      }),
      {
        onConflict: 'canonical_url',
        ignoreDuplicates: true,
      },
    );
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('id');
  });
});


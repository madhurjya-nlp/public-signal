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
          if (table === 'article_votes' || table === 'article_skips') {
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
      story_group_id: null,
      story_title: 'Public signal headline',
      related_sources: [
        {
          source: 'Example Source',
          url: 'https://example.com/story',
        },
      ],
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

          return {
            upsert,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: '20000000-0000-0000-0000-000000000001',
                headline: 'Ingested headline',
                canonical_url: 'https://example.com/ingested',
                published_at: null,
                categories: ['technology'],
              },
              error: null,
            }),
          };
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

  it('keeps duplicate RSS URLs deduped through canonical URL upsert', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const repository = new ArticlesRepository({
      admin: {
        from: jest.fn((table: string) => {
          if (table === 'sources') {
            return {
              upsert: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: '10000000-0000-0000-0000-000000000001' },
                error: null,
              }),
            };
          }

          return {
            upsert,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: '20000000-0000-0000-0000-000000000001',
                headline: 'Duplicate headline',
                canonical_url: 'https://example.com/duplicate',
                published_at: null,
                categories: ['technology'],
              },
              error: null,
            }),
          };
        }),
      },
    } as never);

    const input = {
      title: 'Duplicate headline',
      url: 'https://example.com/duplicate',
      sourceName: 'Example Source',
      thumbnailUrl: null,
      publishedAt: null,
      summary: null,
      categories: ['technology' as const],
    };

    await repository.upsertIngestedArticle(input);
    await repository.upsertIngestedArticle(input);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ canonical_url: 'https://example.com/duplicate' }),
      { onConflict: 'canonical_url', ignoreDuplicates: true },
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ canonical_url: 'https://example.com/duplicate' }),
      { onConflict: 'canonical_url', ignoreDuplicates: true },
    );
  });

  it('checks whether an article exists by canonical URL', async () => {
    const repository = new ArticlesRepository({
      admin: {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: '20000000-0000-0000-0000-000000000001' },
            error: null,
          }),
        })),
      },
    } as never);

    await expect(
      repository.existsByCanonicalUrl('https://example.com/story'),
    ).resolves.toBe(true);
  });

  it('hydrates feed articles with story group related sources', async () => {
    const repository = new ArticlesRepository({
      admin: {
        from: jest.fn((table: string) => {
          if (table === 'article_votes' || table === 'article_skips') {
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
    } as never, {
      findMetadataForArticleIds: jest.fn().mockResolvedValue(
        new Map([
          [
            articleRow.id,
            {
              storyGroupId: '30000000-0000-0000-0000-000000000001',
              storyTitle: 'Grouped public signal headline',
              representativeArticleId: articleRow.id,
              relatedSources: [
                { source: 'Example Source', url: articleRow.canonical_url },
                { source: 'Second Source', url: 'https://example.com/second' },
              ],
            },
          ],
        ]),
      ),
    } as never);

    const items = await repository.findFeedForUser({
      userId: '10000000-0000-0000-0000-000000000001',
      interests: ['technology'],
    });

    expect(items[0]).toEqual(
      expect.objectContaining({
        story_group_id: '30000000-0000-0000-0000-000000000001',
        story_title: 'Grouped public signal headline',
        related_sources: [
          { source: 'Example Source', url: articleRow.canonical_url },
          { source: 'Second Source', url: 'https://example.com/second' },
        ],
      }),
    );
  });

  it('excludes skipped articles from the feed', async () => {
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
          if (table === 'article_skips') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              returns: jest.fn().mockResolvedValue({
                data: [{ article_id: articleRow.id }],
                error: null,
              }),
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

    await expect(
      repository.findFeedForUser({
        userId: '10000000-0000-0000-0000-000000000001',
        interests: ['technology'],
      }),
    ).resolves.toEqual([]);
  });

  it('does not exclude saved-only articles from the feed', async () => {
    const from = jest.fn((table: string) => {
      if (table === 'article_votes' || table === 'article_skips') {
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
    });
    const repository = new ArticlesRepository({ admin: { from } } as never);

    const items = await repository.findFeedForUser({
      userId: '10000000-0000-0000-0000-000000000001',
      interests: ['technology'],
    });

    expect(items).toHaveLength(1);
    expect(from).not.toHaveBeenCalledWith('saved_articles');
  });
});

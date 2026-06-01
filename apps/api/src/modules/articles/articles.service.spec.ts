import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';

describe('ArticlesService', () => {
  it('ingests RSS items, preserves source, and skips items without URL', async () => {
    const upsertIngestedArticle = jest.fn().mockResolvedValue(true);
    const existsByCanonicalUrl = jest.fn().mockResolvedValue(false);
    const service = new ArticlesService(
      {
        existsByCanonicalUrl,
        upsertIngestedArticle,
      } as never,
      {} as never,
      { get: jest.fn().mockReturnValue('false') } as never,
      { assignArticle: jest.fn() } as never,
    );

    (service as unknown as { parser: { parseURL: jest.Mock } }).parser = {
      parseURL: jest.fn().mockResolvedValue({
        items: [
          {
            title: 'Moon mission update',
            link: 'https://example.com/moon',
            contentSnippet: 'A short summary.',
            isoDate: '2026-06-01T00:00:00.000Z',
          },
          {
            title: 'No URL',
          },
        ],
      }),
    };

    const result = await service.ingestConfiguredSources();

    expect(result.sources).toBeGreaterThan(0);
    expect(result.skipped).toBeGreaterThan(0);
    expect(upsertIngestedArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Moon mission update',
        url: 'https://example.com/moon',
        sourceName: expect.any(String),
        summary: 'A short summary.',
      }),
    );
  });

  it('uses user interests when loading the feed', async () => {
    const findFeedForUser = jest.fn().mockResolvedValue([
      {
        id: '20000000-0000-0000-0000-000000000001',
        title: 'Public signal headline',
        url: 'https://example.com/story',
        source: 'Example Source',
        summary: 'Summary',
        thumbnail_url: null,
        published_at: null,
        categories: ['technology'],
        created_at: '2026-06-01T00:00:00.000Z',
      },
    ]);
    const getProfile = jest.fn().mockResolvedValue({
      interests: ['technology'],
    });
    const service = new ArticlesService(
      { findFeedForUser } as never,
      { getProfile } as never,
      { get: jest.fn() } as never,
      { assignArticle: jest.fn() } as never,
    );

    const feed = await service.getFeed('user-1');

    expect(feed.items[0]).toEqual(
      expect.objectContaining({
        id: '20000000-0000-0000-0000-000000000001',
        title: 'Public signal headline',
        url: 'https://example.com/story',
        source: 'Example Source',
      }),
    );
    expect(findFeedForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      interests: ['technology'],
      limit: 20,
    });
  });

  it('disables manual ingestion when MANUAL_INGESTION_ENABLED=false', async () => {
    const service = new ArticlesService(
      {} as never,
      {} as never,
      {
        get: jest.fn((key: string) => {
          if (key === 'MANUAL_INGESTION_ENABLED') {
            return 'false';
          }
          return 'development';
        }),
      } as never,
      {} as never,
    );

    await expect(service.triggerManualIngestion('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('restricts production manual ingestion to configured admin users', async () => {
    const service = new ArticlesService(
      {} as never,
      {} as never,
      {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') {
            return 'production';
          }
          if (key === 'MANUAL_INGESTION_ENABLED') {
            return 'true';
          }
          if (key === 'ADMIN_USER_IDS') {
            return 'admin-1,admin-2';
          }
          return undefined;
        }),
      } as never,
      {} as never,
    );

    await expect(service.triggerManualIngestion('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

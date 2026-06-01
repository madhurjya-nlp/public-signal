import { SOURCE_REGISTRY } from '../../common/public-signal/source-registry';
import {
  assertLocalSupabaseEnvironment,
  ingestRssSource,
  parseLocalRssIngestionArgs,
  resolveManualRssSource,
} from './rss-source-ingestion';

describe('local RSS source ingestion', () => {
  it('can target a candidate RSS source by explicit source id without mutating approval state', async () => {
    const source = resolveManualRssSource('indian-express-india');
    const initialEnabled = source.enabled;
    const initialApprovalStatus = source.approvalStatus;

    expect(source.enabled).toBe(false);
    expect(source.approvalStatus).toBe('candidate');

    await ingestRssSource({
      source,
      limit: 1,
      parser: {
        parseURL: jest.fn().mockResolvedValue({
          items: [
            {
              title: 'Indian Express headline',
              link: 'https://indianexpress.com/article/india/example',
              isoDate: '2026-06-01T00:00:00.000Z',
            },
          ],
        }),
      },
      articles: {
        existsByCanonicalUrl: jest.fn().mockResolvedValue(false),
        upsertIngestedArticle: jest.fn().mockResolvedValue(true),
      },
    });

    expect(source.enabled).toBe(initialEnabled);
    expect(source.approvalStatus).toBe(initialApprovalStatus);
  });

  it('rejects unknown source ids', () => {
    expect(() => resolveManualRssSource('missing-source')).toThrow(
      'Unknown source id: missing-source',
    );
  });

  it('rejects non-RSS sources', () => {
    expect(() => resolveManualRssSource('newsonair-home')).toThrow(
      'only supports RSS sources',
    );
  });

  it('keeps candidate sources excluded from automatic ingestion', () => {
    const automaticSources = SOURCE_REGISTRY.filter(
      (source) => source.enabled && source.approvalStatus === 'approved',
    );

    expect(
      automaticSources.some((source) => source.id === 'indian-express-india'),
    ).toBe(false);
  });

  it('applies default categories and tolerates missing summary and thumbnail', async () => {
    const source = resolveManualRssSource('indian-express-india');
    const upsertIngestedArticle = jest.fn().mockResolvedValue(true);

    const result = await ingestRssSource({
      source,
      limit: 1,
      parser: {
        parseURL: jest.fn().mockResolvedValue({
          items: [
            {
              title: 'Indian Express headline',
              link: 'https://indianexpress.com/article/india/no-summary',
              isoDate: '2026-06-01T00:00:00.000Z',
            },
          ],
        }),
      },
      articles: {
        existsByCanonicalUrl: jest.fn().mockResolvedValue(false),
        upsertIngestedArticle,
      },
    });

    expect(result).toEqual({
      fetched: 1,
      attempted: 1,
      stored: 1,
      skipped: 0,
      failed: 0,
      duplicate: 0,
    });
    expect(upsertIngestedArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceName: source.name,
        categories: ['politics'],
        summary: null,
        thumbnailUrl: null,
      }),
    );
  });

  it('counts duplicate canonical URLs while still using repository upsert dedupe', async () => {
    const upsertIngestedArticle = jest.fn().mockResolvedValue(true);

    const result = await ingestRssSource({
      source: resolveManualRssSource('indian-express-india'),
      limit: 1,
      parser: {
        parseURL: jest.fn().mockResolvedValue({
          items: [
            {
              title: 'Duplicate headline',
              link: 'https://indianexpress.com/article/india/duplicate',
            },
          ],
        }),
      },
      articles: {
        existsByCanonicalUrl: jest.fn().mockResolvedValue(true),
        upsertIngestedArticle,
      },
    });

    expect(result.duplicate).toBe(1);
    expect(result.stored).toBe(0);
    expect(upsertIngestedArticle).toHaveBeenCalledTimes(1);
  });

  it('validates CLI args and local Supabase environment', () => {
    expect(
      parseLocalRssIngestionArgs([
        '--source-id=indian-express-india',
        '--limit=20',
      ]),
    ).toEqual({ sourceId: 'indian-express-india', limit: 20 });
    expect(() =>
      parseLocalRssIngestionArgs([
        '--source-id=indian-express-india',
        '--limit=0',
      ]),
    ).toThrow('greater than or equal to 1');
    expect(() =>
      assertLocalSupabaseEnvironment({
        NODE_ENV: 'production',
        SUPABASE_URL: 'http://127.0.0.1:54321',
        SUPABASE_SERVICE_ROLE_KEY: 'local-key',
      }),
    ).toThrow('NODE_ENV=production');
    expect(
      assertLocalSupabaseEnvironment({
        SUPABASE_URL: 'http://127.0.0.1:54321',
        SUPABASE_SERVICE_ROLE_KEY: 'local-key',
      }),
    ).toEqual({
      SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'local-key',
    });
  });
});

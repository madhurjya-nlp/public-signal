import { SOURCE_REGISTRY } from '../../common/public-signal/source-registry';
import { mapRssItem } from './rss-item.mapper';

const source = SOURCE_REGISTRY.find((item) => item.id === 'nasa-breaking-news');

if (!source) {
  throw new Error('nasa-breaking-news source is required for mapper tests');
}

describe('rss item mapper', () => {
  it('preserves source metadata and applies default categories', () => {
    const mapped = mapRssItem(source, {
      title: 'Space infrastructure update',
      link: 'https://example.com/space',
      contentSnippet: 'A source-provided summary.',
      isoDate: '2026-06-01T00:00:00.000Z',
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        title: 'Space infrastructure update',
        url: 'https://example.com/space',
        sourceName: source.name,
        summary: 'A source-provided summary.',
        categories: ['science'],
      }),
    );
  });

  it('does not fail when thumbnail and summary are missing', () => {
    const mapped = mapRssItem(source, {
      title: 'No media item',
      link: 'https://example.com/no-media',
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        title: 'No media item',
        url: 'https://example.com/no-media',
        thumbnailUrl: null,
        summary: null,
      }),
    );
  });

  it('returns null when required title or URL is missing', () => {
    expect(mapRssItem(source, { title: 'No URL' })).toBeNull();
    expect(mapRssItem(source, { link: 'https://example.com/no-title' })).toBeNull();
  });
});


import {
  getEnabledApprovedSources,
  SOURCE_REGISTRY,
} from './source-registry';

describe('source registry', () => {
  it('returns only enabled, approved RSS sources for automatic ingestion', () => {
    const sources = getEnabledApprovedSources('rss');

    expect(sources.length).toBeGreaterThan(0);
    expect(
      sources.every(
        (source) =>
          source.kind === 'rss' &&
          source.enabled &&
          source.approvalStatus === 'approved',
      ),
    ).toBe(true);
  });

  it('keeps Indian candidate sources disabled until approval', () => {
    const candidateIds = [
      'india-today-rss-directory',
      'republic-world-rss-directory',
      'republic-bharat-rss-directory',
      'newsonair-home',
      'newsonair-regional-text',
      'dd-news-english',
      'aaj-tak-home',
    ];

    for (const id of candidateIds) {
      const source = SOURCE_REGISTRY.find((item) => item.id === id);

      expect(source).toBeDefined();
      expect(source?.enabled).toBe(false);
      expect(source?.approvalStatus).toBe('candidate');
    }
  });
});


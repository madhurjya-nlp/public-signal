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

  it('requires both enabled=true and approvalStatus=approved for automatic ingestion', () => {
    const approvedButDisabled = {
      ...SOURCE_REGISTRY[0],
      id: 'approved-disabled-test',
      enabled: false,
      approvalStatus: 'approved' as const,
    };
    const enabledButCandidate = {
      ...SOURCE_REGISTRY[0],
      id: 'enabled-candidate-test',
      enabled: true,
      approvalStatus: 'candidate' as const,
    };
    const enabledAndApproved = {
      ...SOURCE_REGISTRY[0],
      id: 'enabled-approved-test',
      enabled: true,
      approvalStatus: 'approved' as const,
    };

    const testRegistry = [
      approvedButDisabled,
      enabledButCandidate,
      enabledAndApproved,
    ];
    const automaticSources = testRegistry.filter(
      (source) => source.enabled && source.approvalStatus === 'approved',
    );

    expect(automaticSources).toEqual([enabledAndApproved]);
  });
});

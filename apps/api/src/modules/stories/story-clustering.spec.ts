import {
  calculateTitleSimilarity,
  normalizeStoryTitle,
  shouldClusterArticleWithStory,
  tokenizeNormalizedTitle,
} from './story-clustering';

describe('story clustering', () => {
  it('normalizes punctuation, stop words, spacing, and source suffixes', () => {
    expect(
      normalizeStoryTitle(
        '  India Launches New Lunar Mission: What It Means | Indian Express  ',
      ),
    ).toBe('india launches new lunar mission what it means');
  });

  it('tokenizes normalized titles without duplicate tokens', () => {
    expect(tokenizeNormalizedTitle('india lunar mission india')).toEqual([
      'india',
      'lunar',
      'mission',
    ]);
  });

  it('calculates Jaccard title similarity', () => {
    expect(
      calculateTitleSimilarity(
        'india launches lunar mission',
        'india lunar mission launches',
      ),
    ).toBe(1);
  });

  it('clusters similar headlines inside the publish window', () => {
    expect(
      shouldClusterArticleWithStory(
        {
          title: 'India launches new lunar mission',
          publishedAt: '2026-06-01T10:00:00.000Z',
          categories: ['science'],
        },
        {
          normalized_title: 'india launches new lunar mission',
          latest_published_at: '2026-06-01T08:00:00.000Z',
          primary_category: 'science',
        },
      ),
    ).toBe(true);
  });

  it('does not cluster unrelated headlines', () => {
    expect(
      shouldClusterArticleWithStory(
        {
          title: 'Markets close lower after rate decision',
          publishedAt: '2026-06-01T10:00:00.000Z',
          categories: ['business'],
        },
        {
          normalized_title: 'india launches new lunar mission',
          latest_published_at: '2026-06-01T08:00:00.000Z',
          primary_category: 'science',
        },
      ),
    ).toBe(false);
  });

  it('clusters the controlled local flood seed headlines but not the unrelated control', () => {
    const floodStory = {
      normalized_title: normalizeStoryTitle(
        'Assam floods disrupt Lakhimpur schools as waters rise',
      ),
      latest_published_at: '2026-06-01T08:00:00.000Z',
      primary_category: 'environment',
    };

    expect(
      shouldClusterArticleWithStory(
        {
          title: 'Lakhimpur schools disrupted by Assam floods as waters rise',
          publishedAt: '2026-06-01T09:00:00.000Z',
          categories: ['environment'],
        },
        floodStory,
      ),
    ).toBe(true);
    expect(
      shouldClusterArticleWithStory(
        {
          title: 'Assam floods disrupt Lakhimpur schools as waters rise today',
          publishedAt: '2026-06-01T10:00:00.000Z',
          categories: ['environment'],
        },
        floodStory,
      ),
    ).toBe(true);
    expect(
      shouldClusterArticleWithStory(
        {
          title: 'Technology students build robotics project in Guwahati',
          publishedAt: '2026-06-01T10:30:00.000Z',
          categories: ['technology'],
        },
        floodStory,
      ),
    ).toBe(false);
  });
});

import { InterestCategory } from '../../common/public-signal/categories';

const CLUSTER_THRESHOLD = 0.68;
const MISSING_DATE_THRESHOLD = 0.82;
const PUBLISH_WINDOW_MS = 72 * 60 * 60 * 1000;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'for',
  'from',
  'in',
  'is',
  'of',
  'on',
  'the',
  'to',
  'with',
]);
const SOURCE_SUFFIXES = [
  'india today',
  'indian express',
  'republic world',
  'republic bharat',
  'dd news',
  'newsonair',
];

export interface ClusterableArticle {
  title: string;
  publishedAt: string | null;
  categories: InterestCategory[];
}

export interface ClusterableStoryGroup {
  normalized_title: string;
  latest_published_at: string | null;
  primary_category: string | null;
}

export function normalizeStoryTitle(title: string): string {
  let normalized = title.toLowerCase().trim();

  for (const suffix of SOURCE_SUFFIXES) {
    normalized = normalized.replace(
      new RegExp(`\\s*[-|:]\\s*${escapeRegExp(suffix)}\\s*$`, 'i'),
      '',
    );
  }

  return normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .join(' ');
}

export function tokenizeNormalizedTitle(normalizedTitle: string): string[] {
  return Array.from(
    new Set(
      normalizedTitle
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );
}

export function calculateTitleSimilarity(a: string, b: string): number {
  const aTokens = new Set(tokenizeNormalizedTitle(a));
  const bTokens = new Set(tokenizeNormalizedTitle(b));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  const intersection = Array.from(aTokens).filter((token) =>
    bTokens.has(token),
  ).length;
  const union = new Set([...aTokens, ...bTokens]).size;

  return intersection / union;
}

export function shouldClusterArticleWithStory(
  article: ClusterableArticle,
  storyGroup: ClusterableStoryGroup,
): boolean {
  if (!article.title.trim()) {
    return false;
  }

  const normalizedTitle = normalizeStoryTitle(article.title);
  const similarity = calculateTitleSimilarity(
    normalizedTitle,
    storyGroup.normalized_title,
  );
  const datesAvailable =
    Boolean(article.publishedAt) && Boolean(storyGroup.latest_published_at);

  if (!datesAvailable) {
    return similarity >= MISSING_DATE_THRESHOLD;
  }

  const articleTimestamp = Date.parse(article.publishedAt!);
  const storyTimestamp = Date.parse(storyGroup.latest_published_at!);

  if (
    Number.isNaN(articleTimestamp) ||
    Number.isNaN(storyTimestamp) ||
    Math.abs(articleTimestamp - storyTimestamp) > PUBLISH_WINDOW_MS
  ) {
    return false;
  }

  const categoryBonus =
    storyGroup.primary_category &&
    article.categories.includes(storyGroup.primary_category as InterestCategory)
      ? 0.04
      : 0;

  return similarity + categoryBonus >= CLUSTER_THRESHOLD;
}

export function storyMatchScore(
  article: ClusterableArticle,
  storyGroup: ClusterableStoryGroup,
): number {
  return calculateTitleSimilarity(
    normalizeStoryTitle(article.title),
    storyGroup.normalized_title,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

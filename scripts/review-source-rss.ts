import Parser = require('rss-parser');
import {
  IngestionSource,
  SOURCE_REGISTRY,
} from '../apps/api/src/common/public-signal/source-registry';
import {
  extractSummary,
  extractThumbnail,
  mapRssItem,
} from '../apps/api/src/modules/articles/rss-item.mapper';

type SourceQuality =
  | 'good_candidate'
  | 'usable_with_limitations'
  | 'poor_candidate'
  | 'broken';

interface ReviewResult {
  source_id: string;
  source_name: string;
  url: string;
  kind: string;
  enabled: boolean;
  approval_status: string;
  fetch_success: boolean;
  fetch_error: string | null;
  items_parsed: number;
  items_with_title: number;
  items_with_url: number;
  items_with_published_date: number;
  items_with_summary: number;
  items_with_thumbnail: number;
  unique_urls: number;
  duplicate_urls: number;
  default_categories: string[];
  example_item: unknown;
  source_quality: SourceQuality;
  safe_to_review_further: boolean;
}

async function main() {
  const sourceId = readSourceId();
  const source = SOURCE_REGISTRY.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }

  if (source.kind !== 'rss') {
    throw new Error(
      `Source ${source.id} is kind "${source.kind}". This helper only reviews RSS sources.`,
    );
  }

  const result = await reviewRssSource(source);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function reviewRssSource(source: IngestionSource): Promise<ReviewResult> {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items ?? [];
    const mapped = items.map((item) => mapRssItem(source, item));
    const urls = mapped
      .map((item) => item?.url)
      .filter((url): url is string => Boolean(url));
    const uniqueUrls = new Set(urls);
    const itemsWithSummary = items.filter((item) => Boolean(extractSummary(item)));
    const itemsWithThumbnail = items.filter((item) =>
      Boolean(extractThumbnail(item)),
    );

    const metrics = {
      items_parsed: items.length,
      items_with_title: items.filter((item) => Boolean(item.title?.trim())).length,
      items_with_url: urls.length,
      items_with_published_date: items.filter((item) =>
        Boolean(item.isoDate ?? item.pubDate),
      ).length,
      items_with_summary: itemsWithSummary.length,
      items_with_thumbnail: itemsWithThumbnail.length,
      unique_urls: uniqueUrls.size,
      duplicate_urls: urls.length - uniqueUrls.size,
    };

    const sourceQuality = classifySource(metrics, source);

    return {
      source_id: source.id,
      source_name: source.name,
      url: source.url,
      kind: source.kind,
      enabled: source.enabled,
      approval_status: source.approvalStatus,
      fetch_success: true,
      fetch_error: null,
      ...metrics,
      default_categories: source.defaultCategories,
      example_item: mapped.find(Boolean) ?? null,
      source_quality: sourceQuality,
      safe_to_review_further:
        sourceQuality === 'good_candidate' ||
        sourceQuality === 'usable_with_limitations',
    };
  } catch (error) {
    return {
      source_id: source.id,
      source_name: source.name,
      url: source.url,
      kind: source.kind,
      enabled: source.enabled,
      approval_status: source.approvalStatus,
      fetch_success: false,
      fetch_error: error instanceof Error ? error.message : String(error),
      items_parsed: 0,
      items_with_title: 0,
      items_with_url: 0,
      items_with_published_date: 0,
      items_with_summary: 0,
      items_with_thumbnail: 0,
      unique_urls: 0,
      duplicate_urls: 0,
      default_categories: source.defaultCategories,
      example_item: null,
      source_quality: 'broken',
      safe_to_review_further: false,
    };
  }
}

function classifySource(
  metrics: Pick<
    ReviewResult,
    | 'items_parsed'
    | 'items_with_title'
    | 'items_with_url'
    | 'items_with_published_date'
    | 'items_with_summary'
    | 'unique_urls'
    | 'duplicate_urls'
  >,
  source: IngestionSource,
): SourceQuality {
  if (metrics.items_parsed === 0 || metrics.items_with_url === 0) {
    return 'broken';
  }

  const titleRate = metrics.items_with_title / metrics.items_parsed;
  const urlRate = metrics.items_with_url / metrics.items_parsed;
  const dateRate = metrics.items_with_published_date / metrics.items_parsed;
  const summaryRate = metrics.items_with_summary / metrics.items_parsed;
  const duplicateRate =
    metrics.items_with_url === 0
      ? 1
      : metrics.duplicate_urls / metrics.items_with_url;
  const hasCategoryFit = source.defaultCategories.length > 0;

  if (
    metrics.items_parsed >= 20 &&
    titleRate >= 0.9 &&
    urlRate >= 0.9 &&
    dateRate >= 0.6 &&
    summaryRate >= 0.5 &&
    duplicateRate <= 0.1 &&
    hasCategoryFit
  ) {
    return 'good_candidate';
  }

  if (
    metrics.items_parsed >= 10 &&
    titleRate >= 0.8 &&
    urlRate >= 0.8 &&
    duplicateRate <= 0.2
  ) {
    return 'usable_with_limitations';
  }

  return 'poor_candidate';
}

function readSourceId(): string {
  const sourceIdArg = process.argv.find((arg) => arg.startsWith('--source-id='));
  const sourceId = sourceIdArg?.slice('--source-id='.length);

  if (!sourceId) {
    throw new Error('Usage: ts-node scripts/review-source-rss.ts --source-id=<source-id>');
  }

  return sourceId;
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});


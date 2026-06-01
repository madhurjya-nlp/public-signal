import Parser = require('rss-parser');
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { IngestionSource } from '../../common/public-signal/source-registry';
import { IngestArticleInput } from './articles.repository';

export function mapRssItem(
  source: IngestionSource,
  item: Parser.Item,
): IngestArticleInput | null {
  const title = item.title?.trim();
  const url = item.link?.trim();

  if (!title || !url) {
    return null;
  }

  return {
    title,
    url,
    sourceName: source.name,
    thumbnailUrl: extractThumbnail(item),
    publishedAt: item.isoDate ?? parseDate(item.pubDate),
    summary: extractSummary(item),
    categories: inferCategories(source, item),
  };
}

export function extractSummary(item: Parser.Item): string | null {
  const rawItem = item as Record<string, unknown>;
  const raw =
    item.contentSnippet ??
    item.summary ??
    item.content ??
    rawItem.description;

  if (typeof raw !== 'string') {
    return null;
  }

  return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || null;
}

export function extractThumbnail(item: Parser.Item): string | null {
  const rawItem = item as Record<string, unknown>;
  const mediaContent = rawItem['media:content'];
  const mediaThumbnail = rawItem['media:thumbnail'];
  const enclosure = item.enclosure;

  if (Array.isArray(mediaContent) && hasMediaUrl(mediaContent[0])) {
    return mediaContent[0].$.url;
  }

  if (hasMediaUrl(mediaContent)) {
    return mediaContent.$.url;
  }

  if (Array.isArray(mediaThumbnail) && hasMediaUrl(mediaThumbnail[0])) {
    return mediaThumbnail[0].$.url;
  }

  if (hasMediaUrl(mediaThumbnail)) {
    return mediaThumbnail.$.url;
  }

  return enclosure?.url ?? null;
}

function hasMediaUrl(value: unknown): value is { $: { url: string } } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$' in value &&
    typeof (value as { $?: { url?: unknown } }).$?.url === 'string'
  );
}

function inferCategories(
  source: IngestionSource,
  item: Parser.Item,
): InterestCategory[] {
  const itemCategories = (item.categories ?? [])
    .map((category) => category.trim().toLowerCase())
    .filter(isInterestCategory);

  return Array.from(new Set([...itemCategories, ...source.defaultCategories]));
}

function parseDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}


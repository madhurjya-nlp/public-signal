import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser = require('rss-parser');
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import {
  getEnabledApprovedSources,
  IngestionSource,
} from '../../common/public-signal/source-registry';
import { UsersRepository } from '../users/users.repository';
import { ArticlesRepository, IngestArticleInput } from './articles.repository';

@Injectable()
export class ArticlesService {
  private readonly parser = new Parser();

  constructor(
    private readonly articles: ArticlesRepository,
    private readonly users: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async getArticle(articleId: string) {
    return this.articles.findArticleById(articleId);
  }

  async getFeed(userId: string) {
    const profile = await this.users.getProfile(userId);
    const items = await this.articles.findFeedForUser({
      userId,
      interests: profile.interests,
      limit: 20,
    });

    return { items };
  }

  async ingestConfiguredSources() {
    const sources = getEnabledApprovedSources('rss');
    let stored = 0;
    let skipped = 0;

    for (const source of sources) {
      const result = await this.ingestSource(source);
      stored += result.stored;
      skipped += result.skipped;
    }

    return {
      sources: sources.length,
      stored,
      skipped,
    };
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async scheduledIngestion() {
    const enabled = this.config.get<string>('RSS_POLLING_ENABLED', 'true');

    if (enabled === 'false') {
      return;
    }

    await this.ingestConfiguredSources();
  }

  private async ingestSource(source: IngestionSource) {
    const feed = await this.parser.parseURL(source.url);
    let stored = 0;
    let skipped = 0;

    for (const item of feed.items.slice(0, 100)) {
      const input = this.mapRssItem(source, item);

      if (!input) {
        skipped += 1;
        continue;
      }

      await this.articles.upsertIngestedArticle(input);
      stored += 1;
    }

    return { stored, skipped };
  }

  private mapRssItem(
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
}

function extractSummary(item: Parser.Item): string | null {
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

function extractThumbnail(item: Parser.Item): string | null {
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

  if (
    Array.isArray(mediaThumbnail) &&
    hasMediaUrl(mediaThumbnail[0])
  ) {
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

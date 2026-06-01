import { BadRequestException, Injectable } from '@nestjs/common';
import { RankingItem } from '@personal-newspaper/contracts';
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { VOTE_POINTS } from '../../common/public-signal/votes';
import { StoriesRepository } from '../stories/stories.repository';
import { UsersRepository } from '../users/users.repository';
import { RankingsRepository } from './rankings.repository';

interface ArticleAggregate {
  article: RankingItem;
  positiveVotes: number;
  negativeVotes: number;
  neutralVotes: number;
  thumbnails: string[];
  latestPublishedAt: string | null;
}

interface DailyRankingsOptions {
  userId?: string;
  scope?: string;
  limit?: string;
}

@Injectable()
export class RankingsService {
  constructor(
    private readonly rankings: RankingsRepository,
    private readonly stories: StoriesRepository,
    private readonly users: UsersRepository,
  ) {}

  async getDailyRankings(options: DailyRankingsOptions = {}) {
    const limit = parseRankingLimit(options.limit);
    const interests =
      options.scope === 'my_interests' && options.userId
        ? new Set((await this.users.getProfile(options.userId)).interests)
        : new Set<string>();
    const { start, end } = getTodayBounds();
    const votes = await this.rankings.findVotesBetween(start, end);
    const articleRows = votes
      .map((vote) => (Array.isArray(vote.article) ? vote.article[0] : vote.article))
      .filter((article): article is NonNullable<typeof article> => Boolean(article));
    const storyMetadata = await this.stories.findMetadataForArticleIds(
      articleRows.map((article) => article.id),
    );
    const aggregates = new Map<string, ArticleAggregate>();

    for (const vote of votes) {
      const articleRow = Array.isArray(vote.article) ? vote.article[0] : vote.article;
      if (!articleRow) {
        continue;
      }

      const story = storyMetadata.get(articleRow.id);
      const aggregateId = story?.storyGroupId ?? articleRow.id;
      const source = Array.isArray(articleRow.source)
        ? articleRow.source[0]?.name ?? 'Unknown Source'
        : articleRow.source?.name ?? 'Unknown Source';
      const existing = aggregates.get(aggregateId) ?? {
        article: {
          id: articleRow.id,
          title: story?.storyTitle ?? articleRow.headline,
          url: articleRow.canonical_url,
          source,
          thumbnail_url: story?.storyThumbnailUrl ?? articleRow.thumbnail_url,
          published_at: articleRow.published_at,
          summary: articleRow.summary,
          categories: normalizeCategories(articleRow.categories ?? []),
          created_at: articleRow.created_at,
          story_group_id: story?.storyGroupId ?? null,
          story_title: story?.storyTitle ?? articleRow.headline,
          related_sources: story?.relatedSources.length
            ? story.relatedSources
            : [{ source, url: articleRow.canonical_url }],
          representative_article_id:
            story?.representativeArticleId ?? articleRow.id,
          representative_source: story?.representativeSource ?? source,
          representative_url: story?.representativeUrl ?? articleRow.canonical_url,
          latest_published_at: story?.latestPublishedAt ?? articleRow.published_at,
          rankingScore: 0,
          voteCounts: {
            critical: 0,
            worthKnowing: 0,
            notImportant: 0,
          },
          totalVotes: 0,
        },
        positiveVotes: 0,
        negativeVotes: 0,
        neutralVotes: 0,
        thumbnails: [],
        latestPublishedAt: story?.latestPublishedAt ?? null,
      };

      if (articleRow.thumbnail_url) {
        existing.thumbnails.push(articleRow.thumbnail_url);
        existing.article.thumbnail_url ??= articleRow.thumbnail_url;
      }
      existing.latestPublishedAt = latestDate(
        existing.latestPublishedAt,
        articleRow.published_at,
      );
      existing.article.latest_published_at = existing.latestPublishedAt;
      existing.article.categories = mergeCategories(
        existing.article.categories,
        normalizeCategories(articleRow.categories ?? []),
      );

      existing.article.rankingScore += VOTE_POINTS[vote.vote_type];
      existing.article.totalVotes += 1;

      if (vote.vote_type === 'critical') {
        existing.article.voteCounts.critical += 1;
        existing.positiveVotes += 1;
      } else if (vote.vote_type === 'worth_knowing') {
        existing.article.voteCounts.worthKnowing += 1;
        existing.neutralVotes += 1;
      } else {
        existing.article.voteCounts.notImportant += 1;
        existing.negativeVotes += 1;
      }

      aggregates.set(aggregateId, existing);
    }

    const items = Array.from(aggregates.values()).filter((item) =>
      interests.size === 0 ? true : hasInterestOverlap(item.article.categories, interests),
    );

    return {
      most_important: items
        .map((item) => item.article)
        .filter((item) => item.rankingScore > 0)
        .sort((a, b) => b.rankingScore - a.rankingScore || b.totalVotes - a.totalVotes)
        .slice(0, limit),
      most_ignored: items
        .map((item) => item.article)
        .filter((item) => item.rankingScore <= 0)
        .sort((a, b) => a.rankingScore - b.rankingScore || b.totalVotes - a.totalVotes)
        .slice(0, limit),
      most_divisive: items
        .filter(isDivisive)
        .sort(
          (a, b) =>
            divisivenessScore(b) - divisivenessScore(a) ||
            Math.abs(a.article.rankingScore) - Math.abs(b.article.rankingScore),
        )
        .map((item) => item.article)
        .slice(0, limit),
    };
  }
}

function parseRankingLimit(rawLimit?: string): number {
  if (!rawLimit) {
    return 10;
  }

  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new BadRequestException('limit must be an integer greater than 0');
  }

  return Math.min(limit, 50);
}

function normalizeCategories(categories: string[]): InterestCategory[] {
  return categories
    .map((category) => category.trim().toLowerCase())
    .filter(isInterestCategory);
}

function hasInterestOverlap(
  categories: string[],
  interests: Set<string>,
): boolean {
  if (interests.size === 0) {
    return true;
  }

  return normalizeCategories(categories).some((category) => interests.has(category));
}

function mergeCategories(
  current: InterestCategory[],
  next: InterestCategory[],
): InterestCategory[] {
  return Array.from(new Set([...current, ...next]));
}

function latestDate(current: string | null, candidate: string | null): string | null {
  if (!candidate) {
    return current;
  }
  if (!current) {
    return candidate;
  }

  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

function isDivisive(item: ArticleAggregate): boolean {
  const presentTypes = [
    item.article.voteCounts.critical,
    item.article.voteCounts.worthKnowing,
    item.article.voteCounts.notImportant,
  ].filter((count) => count > 0).length;

  return presentTypes >= 2;
}

function divisivenessScore(item: ArticleAggregate): number {
  const positive = item.positiveVotes;
  const negativeOrNeutral = item.negativeVotes + item.neutralVotes;
  const balance = 1 / (1 + Math.abs(positive - negativeOrNeutral));

  return balance * item.article.totalVotes;
}

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

import { Injectable } from '@nestjs/common';
import { RankingItem } from '@personal-newspaper/contracts';
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { VOTE_POINTS } from '../../common/public-signal/votes';
import { RankingsRepository } from './rankings.repository';

interface ArticleAggregate {
  article: RankingItem;
  positiveVotes: number;
  negativeVotes: number;
  neutralVotes: number;
}

@Injectable()
export class RankingsService {
  constructor(private readonly rankings: RankingsRepository) {}

  async getDailyRankings() {
    const { start, end } = getTodayBounds();
    const votes = await this.rankings.findVotesBetween(start, end);
    const aggregates = new Map<string, ArticleAggregate>();

    for (const vote of votes) {
      const articleRow = Array.isArray(vote.article) ? vote.article[0] : vote.article;
      if (!articleRow) {
        continue;
      }

      const existing = aggregates.get(articleRow.id) ?? {
        article: {
          id: articleRow.id,
          title: articleRow.headline,
          url: articleRow.canonical_url,
          source: Array.isArray(articleRow.source)
            ? articleRow.source[0]?.name ?? 'Unknown Source'
            : articleRow.source?.name ?? 'Unknown Source',
          thumbnail_url: articleRow.thumbnail_url,
          published_at: articleRow.published_at,
          summary: articleRow.summary,
          categories: normalizeCategories(articleRow.categories ?? []),
          created_at: articleRow.created_at,
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
      };

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

      aggregates.set(articleRow.id, existing);
    }

    const items = Array.from(aggregates.values());

    return {
      most_important: items
        .map((item) => item.article)
        .filter((item) => item.rankingScore > 0)
        .sort((a, b) => b.rankingScore - a.rankingScore || b.totalVotes - a.totalVotes)
        .slice(0, 10),
      most_ignored: items
        .map((item) => item.article)
        .filter((item) => item.rankingScore <= 0)
        .sort((a, b) => a.rankingScore - b.rankingScore || b.totalVotes - a.totalVotes)
        .slice(0, 10),
      most_divisive: items
        .filter(isDivisive)
        .sort(
          (a, b) =>
            divisivenessScore(b) - divisivenessScore(a) ||
            Math.abs(a.article.rankingScore) - Math.abs(b.article.rankingScore),
        )
        .map((item) => item.article)
        .slice(0, 10),
    };
  }
}

function normalizeCategories(categories: string[]): InterestCategory[] {
  return categories
    .map((category) => category.trim().toLowerCase())
    .filter(isInterestCategory);
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

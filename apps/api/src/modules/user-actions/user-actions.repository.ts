import { Injectable } from '@nestjs/common';
import type { PublicSignalArticle } from '@personal-newspaper/contracts';
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { VoteType } from '../../common/public-signal/votes';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { StoriesRepository, StoryMetadata } from '../stories/stories.repository';
import { SupabaseService } from '../supabase/supabase.service';

interface SavedArticleRow {
  article_id: string;
  story_group_id: string | null;
  created_at: string;
}

interface VoteDetailRow {
  article_id: string;
  vote_type: VoteType;
  created_at: string;
}

interface SkipDetailRow {
  article_id: string;
  created_at: string;
}

interface ArticleRow {
  id: string;
  headline: string;
  canonical_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
  summary: string | null;
  categories: string[] | null;
  created_at: string;
  source: { name: string } | Array<{ name: string }> | null;
  enrichment:
    | { summary: string | null; topics: string[] | null }
    | Array<{ summary: string | null; topics: string[] | null }>
    | null;
}

interface VoteAnalyticsRow {
  article_id: string;
  vote_type: VoteType;
  created_at: string;
  article:
    | {
        id: string;
        headline: string;
        categories: string[] | null;
        source: { name: string } | Array<{ name: string }> | null;
      }
    | Array<{
        id: string;
        headline: string;
        categories: string[] | null;
        source: { name: string } | Array<{ name: string }> | null;
      }>
    | null;
}

export interface UserAnalytics {
  total_votes: number;
  critical_votes: number;
  worth_knowing_votes: number;
  not_important_votes: number;
  skipped_articles: number;
  saved_articles: number;
  unique_sources_voted: number;
  unique_story_groups_voted: number;
  top_interests: Array<{ interest: string; votes: number }>;
  recent_activity: Array<{
    type: 'vote' | 'save' | 'skip';
    vote_type?: VoteType;
    article_id: string;
    story_title: string;
    source: string;
    created_at: string;
  }>;
}

@Injectable()
export class UserActionsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stories: StoriesRepository,
  ) {}

  async saveArticle(params: {
    userId: string;
    articleId: string;
    storyGroupId: string | null;
  }): Promise<void> {
    const { error } = await this.supabase.admin.from('saved_articles').upsert(
      {
        user_id: params.userId,
        article_id: params.articleId,
        story_group_id: params.storyGroupId,
      },
      { onConflict: 'user_id,article_id', ignoreDuplicates: true },
    );

    assertSupabaseSuccess(error);
  }

  async unsaveArticle(userId: string, articleId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from('saved_articles')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId);

    assertSupabaseSuccess(error);
  }

  async skipArticle(params: {
    userId: string;
    articleId: string;
    storyGroupId: string | null;
  }): Promise<void> {
    const { error } = await this.supabase.admin.from('article_skips').upsert(
      {
        user_id: params.userId,
        article_id: params.articleId,
        story_group_id: params.storyGroupId,
      },
      { onConflict: 'user_id,article_id', ignoreDuplicates: true },
    );

    assertSupabaseSuccess(error);
  }

  async findSavedArticles(userId: string): Promise<{
    items: Array<{ article: PublicSignalArticle; saved_at: string }>;
  }> {
    const { data: savedRows, error } = await this.supabase.admin
      .from('saved_articles')
      .select('article_id, story_group_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<SavedArticleRow[]>();

    assertSupabaseSuccess(error);
    const articleIds = (savedRows ?? []).map((row) => row.article_id);
    const articles = await this.findArticlesByIds(articleIds);
    const articlesById = new Map(articles.map((article) => [article.id, article]));

    return {
      items: (savedRows ?? []).flatMap((row) => {
        const article = articlesById.get(row.article_id);
        return article ? [{ article, saved_at: row.created_at }] : [];
      }),
    };
  }

  async findVotedArticles(
    userId: string,
    voteType?: VoteType,
    limit = 50,
  ): Promise<{
    items: Array<{
      article: PublicSignalArticle;
      vote_type: VoteType;
      created_at: string;
    }>;
  }> {
    let query = this.supabase.admin
      .from('article_votes')
      .select('article_id, vote_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (voteType) {
      query = query.eq('vote_type', voteType);
    }

    const { data, error } = await query.returns<VoteDetailRow[]>();
    assertSupabaseSuccess(error);
    const articlesById = await this.findArticlesMap(
      (data ?? []).map((row) => row.article_id),
    );

    return {
      items: (data ?? []).flatMap((row) => {
        const article = articlesById.get(row.article_id);
        return article
          ? [
              {
                article,
                vote_type: row.vote_type,
                created_at: row.created_at,
              },
            ]
          : [];
      }),
    };
  }

  async findSkippedArticles(userId: string, limit = 50): Promise<{
    items: Array<{ article: PublicSignalArticle; skipped_at: string }>;
  }> {
    const { data, error } = await this.supabase.admin
      .from('article_skips')
      .select('article_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<SkipDetailRow[]>();

    assertSupabaseSuccess(error);
    const articlesById = await this.findArticlesMap(
      (data ?? []).map((row) => row.article_id),
    );

    return {
      items: (data ?? []).flatMap((row) => {
        const article = articlesById.get(row.article_id);
        return article ? [{ article, skipped_at: row.created_at }] : [];
      }),
    };
  }

  async getAnalytics(userId: string): Promise<UserAnalytics> {
    const [votes, skippedCount, savedCount] = await Promise.all([
      this.findVotesForAnalytics(userId),
      this.countRows('article_skips', userId),
      this.countRows('saved_articles', userId),
    ]);
    const articleIds = votes.map((vote) => vote.article_id);
    const storyMetadata = await this.stories.findMetadataForArticleIds(articleIds);
    const sourceNames = new Set<string>();
    const storyIds = new Set<string>();
    const interestCounts = new Map<string, number>();
    let criticalVotes = 0;
    let worthKnowingVotes = 0;
    let notImportantVotes = 0;

    for (const vote of votes) {
      const article = articleFromVote(vote);
      const source = sourceName(article?.source);
      if (source) {
        sourceNames.add(source);
      }

      const story = storyMetadata.get(vote.article_id);
      storyIds.add(story?.storyGroupId ?? vote.article_id);

      for (const category of normalizeCategories(article?.categories ?? [])) {
        interestCounts.set(category, (interestCounts.get(category) ?? 0) + 1);
      }

      if (vote.vote_type === 'critical') {
        criticalVotes += 1;
      } else if (vote.vote_type === 'worth_knowing') {
        worthKnowingVotes += 1;
      } else {
        notImportantVotes += 1;
      }
    }

    return {
      total_votes: votes.length,
      critical_votes: criticalVotes,
      worth_knowing_votes: worthKnowingVotes,
      not_important_votes: notImportantVotes,
      skipped_articles: skippedCount,
      saved_articles: savedCount,
      unique_sources_voted: sourceNames.size,
      unique_story_groups_voted: storyIds.size,
      top_interests: Array.from(interestCounts.entries())
        .map(([interest, count]) => ({ interest, votes: count }))
        .sort((a, b) => b.votes - a.votes || a.interest.localeCompare(b.interest))
        .slice(0, 5),
      recent_activity: votes.slice(0, 10).map((vote) => {
        const article = articleFromVote(vote);
        const story = storyMetadata.get(vote.article_id);
        return {
          type: 'vote',
          vote_type: vote.vote_type,
          article_id: vote.article_id,
          story_title: story?.storyTitle ?? article?.headline ?? 'Untitled',
          source: sourceName(article?.source) ?? 'Unknown Source',
          created_at: vote.created_at,
        };
      }),
    };
  }

  private async findArticlesByIds(articleIds: string[]): Promise<PublicSignalArticle[]> {
    if (articleIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.admin
      .from('articles')
      .select(
        `
        id,
        headline,
        canonical_url,
        thumbnail_url,
        published_at,
        summary,
        categories,
        created_at,
        source:sources(name),
        enrichment:article_enrichments(summary, topics)
      `,
      )
      .in('id', articleIds)
      .returns<ArticleRow[]>();

    assertSupabaseSuccess(error);
    const storyMetadata = await this.stories.findMetadataForArticleIds(articleIds);
    return (data ?? []).map((row) => mapArticle(row, storyMetadata.get(row.id)));
  }

  private async findArticlesMap(
    articleIds: string[],
  ): Promise<Map<string, PublicSignalArticle>> {
    const articles = await this.findArticlesByIds(articleIds);
    return new Map(articles.map((article) => [article.id, article]));
  }

  private async findVotesForAnalytics(userId: string): Promise<VoteAnalyticsRow[]> {
    const { data, error } = await this.supabase.admin
      .from('article_votes')
      .select(
        `
        article_id,
        vote_type,
        created_at,
        article:articles(
          id,
          headline,
          categories,
          source:sources(name)
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<VoteAnalyticsRow[]>();

    assertSupabaseSuccess(error);
    return data ?? [];
  }

  private async countRows(table: 'article_skips' | 'saved_articles', userId: string) {
    const { count, error } = await this.supabase.admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    assertSupabaseSuccess(error);
    return count ?? 0;
  }
}

function mapArticle(row: ArticleRow, story?: StoryMetadata): PublicSignalArticle {
  const source = sourceName(row.source) ?? 'Unknown Source';
  const enrichment = Array.isArray(row.enrichment)
    ? row.enrichment[0]
    : row.enrichment;
  const categories = normalizeCategories(
    row.categories?.length ? row.categories : enrichment?.topics ?? [],
  );

  return {
    id: row.id,
    title: row.headline,
    url: row.canonical_url,
    source,
    thumbnail_url: row.thumbnail_url,
    published_at: row.published_at,
    summary: row.summary ?? enrichment?.summary ?? null,
    categories,
    created_at: row.created_at,
    story_group_id: story?.storyGroupId ?? null,
    story_title: story?.storyTitle ?? row.headline,
    related_sources: story?.relatedSources.length
      ? story.relatedSources
      : [{ source, url: row.canonical_url }],
  };
}

function articleFromVote(row: VoteAnalyticsRow) {
  return Array.isArray(row.article) ? row.article[0] : row.article;
}

function sourceName(
  source: { name: string } | Array<{ name: string }> | null | undefined,
): string | null {
  if (Array.isArray(source)) {
    return source[0]?.name ?? null;
  }
  return source?.name ?? null;
}

function normalizeCategories(categories: string[]): InterestCategory[] {
  return categories
    .map((category) => category.trim().toLowerCase())
    .filter(isInterestCategory);
}

import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicSignalArticle } from '@personal-newspaper/contracts';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { SupabaseService } from '../supabase/supabase.service';

interface ArticleQueryRow {
  id: string;
  headline: string;
  canonical_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
  summary: string | null;
  categories: string[] | null;
  created_at: string;
  source:
    | {
        name: string;
      }
    | Array<{
        name: string;
      }>
    | null;
  enrichment:
    | {
        summary: string | null;
        topics: string[] | null;
      }
    | Array<{
        summary: string | null;
        topics: string[] | null;
      }>
    | null;
}

export interface IngestArticleInput {
  title: string;
  url: string;
  sourceName: string;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  categories: InterestCategory[];
}

@Injectable()
export class ArticlesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findArticleById(articleId: string): Promise<PublicSignalArticle> {
    const { data, error } = await this.articleQuery()
      .eq('id', articleId)
      .maybeSingle<ArticleQueryRow>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new NotFoundException('Article not found');
    }

    return mapArticle(data);
  }

  async findFeedForUser(params: {
    userId: string;
    interests: string[];
    limit?: number;
  }): Promise<PublicSignalArticle[]> {
    const votedArticleIds = await this.findVotedArticleIds(params.userId);
    const { data, error } = await this.articleQuery()
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200)
      .returns<ArticleQueryRow[]>();

    assertSupabaseSuccess(error);

    const interests = new Set(
      params.interests.filter(isInterestCategory),
    );

    return (data ?? [])
      .map(mapArticle)
      .filter((article) => !votedArticleIds.has(article.id))
      .sort((a, b) => {
        const aPriority = hasInterestMatch(a, interests) ? 0 : 1;
        const bPriority = hasInterestMatch(b, interests) ? 0 : 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return dateValue(b.published_at ?? b.created_at) - dateValue(a.published_at ?? a.created_at);
      })
      .slice(0, params.limit ?? 20);
  }

  async upsertIngestedArticle(input: IngestArticleInput): Promise<boolean> {
    const sourceId = await this.upsertSource(input.sourceName);
    const { error } = await this.supabase.admin.from('articles').upsert(
      {
        source_id: sourceId,
        headline: input.title,
        canonical_url: input.url,
        thumbnail_url: input.thumbnailUrl ?? null,
        published_at: input.publishedAt ?? null,
        summary: input.summary ?? null,
        categories: input.categories,
      },
      {
        onConflict: 'canonical_url',
        ignoreDuplicates: true,
      },
    );

    assertSupabaseSuccess(error);
    return true;
  }

  async exists(articleId: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .maybeSingle<{ id: string }>();

    assertSupabaseSuccess(error);
    return Boolean(data);
  }

  private articleQuery() {
    return this.supabase.admin.from('articles').select(`
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
    `);
  }

  private async upsertSource(name: string): Promise<string> {
    const { data, error } = await this.supabase.admin
      .from('sources')
      .upsert({ name }, { onConflict: 'name' })
      .select('id')
      .single<{ id: string }>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new Error(`Source was not persisted: ${name}`);
    }

    return data.id;
  }

  private async findVotedArticleIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.supabase.admin
      .from('article_votes')
      .select('article_id')
      .eq('user_id', userId)
      .returns<Array<{ article_id: string }>>();

    assertSupabaseSuccess(error);
    return new Set((data ?? []).map((row) => row.article_id));
  }
}

function mapArticle(row: ArticleQueryRow): PublicSignalArticle {
  const source = Array.isArray(row.source) ? row.source[0] : row.source;
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
    source: source?.name ?? 'Unknown Source',
    thumbnail_url: row.thumbnail_url,
    published_at: row.published_at,
    summary: row.summary ?? enrichment?.summary ?? null,
    categories,
    created_at: row.created_at,
  };
}

function normalizeCategories(categories: string[]): InterestCategory[] {
  return categories
    .map((category) => category.trim().toLowerCase())
    .filter(isInterestCategory);
}

function hasInterestMatch(
  article: PublicSignalArticle,
  interests: Set<string>,
): boolean {
  if (interests.size === 0) {
    return false;
  }

  return article.categories.some((category) => interests.has(category));
}

function dateValue(value: string): number {
  return Number.isNaN(Date.parse(value)) ? 0 : Date.parse(value);
}

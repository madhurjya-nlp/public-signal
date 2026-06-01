import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicSignalArticle } from '@personal-newspaper/contracts';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import {
  InterestCategory,
  isInterestCategory,
} from '../../common/public-signal/categories';
import { SupabaseService } from '../supabase/supabase.service';
import {
  StoriesRepository,
  StoryArticleInput,
  StoryMetadata,
} from '../stories/stories.repository';

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

export type PersistedIngestedArticle = StoryArticleInput;

@Injectable()
export class ArticlesRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly stories?: StoriesRepository,
  ) {}

  async findArticleById(articleId: string): Promise<PublicSignalArticle> {
    const { data, error } = await this.articleQuery()
      .eq('id', articleId)
      .maybeSingle<ArticleQueryRow>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new NotFoundException('Article not found');
    }

    return (await this.hydrateStoryMetadata([mapArticle(data)]))[0];
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

    const articles = await this.hydrateStoryMetadata((data ?? []).map(mapArticle));

    return articles
      .filter((article) => !votedArticleIds.has(article.id))
      .sort((a, b) => {
        const aPriority = hasInterestMatch(a, interests) ? 0 : 1;
        const bPriority = hasInterestMatch(b, interests) ? 0 : 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return dateValue(b.published_at ?? b.created_at) - dateValue(a.published_at ?? a.created_at);
      })
      .filter(uniqueStoryGroup)
      .slice(0, params.limit ?? 20);
  }

  async upsertIngestedArticle(
    input: IngestArticleInput,
  ): Promise<PersistedIngestedArticle> {
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
    const { data, error: findError } = await this.supabase.admin
      .from('articles')
      .select('id, headline, canonical_url, published_at, categories')
      .eq('canonical_url', input.url)
      .single<{
        id: string;
        headline: string;
        canonical_url: string;
        published_at: string | null;
        categories: string[] | null;
      }>();

    assertSupabaseSuccess(findError);
    if (!data) {
      throw new Error(`Article was not persisted: ${input.url}`);
    }

    return {
      id: data.id,
      title: data.headline,
      url: data.canonical_url,
      sourceName: input.sourceName,
      publishedAt: data.published_at,
      categories: normalizeCategories(data.categories ?? []),
    };
  }

  async findArticlesForStoryBackfill(): Promise<PersistedIngestedArticle[]> {
    const { data, error } = await this.supabase.admin
      .from('articles')
      .select(
        'id, headline, canonical_url, published_at, categories, source:sources(name)',
      )
      .order('published_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .returns<
        Array<{
          id: string;
          headline: string;
          canonical_url: string;
          published_at: string | null;
          categories: string[] | null;
          source: { name: string } | Array<{ name: string }> | null;
        }>
      >();

    assertSupabaseSuccess(error);
    return (data ?? []).map((article) => {
      const source = Array.isArray(article.source)
        ? article.source[0]
        : article.source;
      return {
        id: article.id,
        title: article.headline,
        url: article.canonical_url,
        sourceName: source?.name ?? 'Unknown Source',
        publishedAt: article.published_at,
        categories: normalizeCategories(article.categories ?? []),
      };
    });
  }

  async existsByCanonicalUrl(url: string): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('articles')
      .select('id')
      .eq('canonical_url', url)
      .maybeSingle<{ id: string }>();

    assertSupabaseSuccess(error);
    return Boolean(data);
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

  private async hydrateStoryMetadata(
    articles: PublicSignalArticle[],
  ): Promise<PublicSignalArticle[]> {
    const metadata = this.stories
      ? await this.stories.findMetadataForArticleIds(
          articles.map((article) => article.id),
        )
      : new Map<string, StoryMetadata>();

    return articles.map((article) => {
      const story = metadata.get(article.id);
      return {
        ...article,
        story_group_id: story?.storyGroupId ?? null,
        story_title: story?.storyTitle ?? article.title,
        related_sources: story?.relatedSources.length
          ? story.relatedSources
          : [{ source: article.source, url: article.url }],
      };
    });
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
    story_group_id: null,
    story_title: row.headline,
    related_sources: [
      {
        source: source?.name ?? 'Unknown Source',
        url: row.canonical_url,
      },
    ],
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

function uniqueStoryGroup(
  article: PublicSignalArticle,
  index: number,
  articles: PublicSignalArticle[],
): boolean {
  if (!article.story_group_id) {
    return true;
  }

  return (
    articles.findIndex(
      (candidate) => candidate.story_group_id === article.story_group_id,
    ) === index
  );
}

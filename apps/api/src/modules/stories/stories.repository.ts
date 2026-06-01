import { Injectable } from '@nestjs/common';
import { InterestCategory } from '../../common/public-signal/categories';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { SupabaseService } from '../supabase/supabase.service';

export interface StoryGroupRow {
  id: string;
  canonical_title: string;
  normalized_title: string;
  representative_article_id: string | null;
  primary_category: string | null;
  first_published_at: string | null;
  latest_published_at: string | null;
  source_count: number;
}

export interface StoryArticleInput {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
  categories: InterestCategory[];
}

export interface RelatedSource {
  source: string;
  url: string | null;
}

export interface StoryMetadata {
  storyGroupId: string;
  storyTitle: string;
  representativeArticleId: string | null;
  representativeSource?: string | null;
  representativeUrl?: string | null;
  storyThumbnailUrl?: string | null;
  latestPublishedAt?: string | null;
  relatedSources: RelatedSource[];
}

@Injectable()
export class StoriesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findLinkByArticleId(articleId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from('story_group_articles')
      .select('story_group_id')
      .eq('article_id', articleId)
      .maybeSingle<{ story_group_id: string }>();

    assertSupabaseSuccess(error);
    return data?.story_group_id ?? null;
  }

  async findRecentGroups(limit = 250): Promise<StoryGroupRow[]> {
    const { data, error } = await this.supabase.admin
      .from('story_groups')
      .select(
        'id, canonical_title, normalized_title, representative_article_id, primary_category, first_published_at, latest_published_at, source_count',
      )
      .order('latest_published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
      .returns<StoryGroupRow[]>();

    assertSupabaseSuccess(error);
    return data ?? [];
  }

  async createGroup(input: {
    canonicalTitle: string;
    normalizedTitle: string;
    representativeArticleId: string;
    primaryCategory: string | null;
    publishedAt: string | null;
  }): Promise<StoryGroupRow> {
    const { data, error } = await this.supabase.admin
      .from('story_groups')
      .insert({
        canonical_title: input.canonicalTitle,
        normalized_title: input.normalizedTitle,
        representative_article_id: input.representativeArticleId,
        primary_category: input.primaryCategory,
        first_published_at: input.publishedAt,
        latest_published_at: input.publishedAt,
      })
      .select(
        'id, canonical_title, normalized_title, representative_article_id, primary_category, first_published_at, latest_published_at, source_count',
      )
      .single<StoryGroupRow>();

    assertSupabaseSuccess(error);
    if (!data) {
      throw new Error('Story group was not persisted.');
    }
    return data;
  }

  async linkArticle(groupId: string, article: StoryArticleInput): Promise<boolean> {
    const { data, error } = await this.supabase.admin
      .from('story_group_articles')
      .upsert(
        {
          story_group_id: groupId,
          article_id: article.id,
          source: article.sourceName,
          url: article.url,
        },
        {
          onConflict: 'article_id',
          ignoreDuplicates: true,
        },
      )
      .select('article_id')
      .returns<Array<{ article_id: string }>>();

    assertSupabaseSuccess(error);
    return (data ?? []).length > 0;
  }

  async refreshGroup(groupId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('story_group_articles')
      .select('source, article:articles(published_at)')
      .eq('story_group_id', groupId)
      .returns<
        Array<{
          source: string;
          article:
            | { published_at: string | null }
            | Array<{ published_at: string | null }>
            | null;
        }>
      >();

    assertSupabaseSuccess(error);
    const publishedDates = (data ?? [])
      .map((row) => {
        const article = Array.isArray(row.article) ? row.article[0] : row.article;
        return article?.published_at ?? null;
      })
      .filter((date): date is string => Boolean(date))
      .sort();

    const { error: updateError } = await this.supabase.admin
      .from('story_groups')
      .update({
        source_count: new Set((data ?? []).map((row) => row.source)).size,
        first_published_at: publishedDates[0] ?? null,
        latest_published_at: publishedDates[publishedDates.length - 1] ?? null,
      })
      .eq('id', groupId);

    assertSupabaseSuccess(updateError);
  }

  async findMetadataForArticleIds(
    articleIds: string[],
  ): Promise<Map<string, StoryMetadata>> {
    if (articleIds.length === 0) {
      return new Map();
    }

    const { data: links, error: linksError } = await this.supabase.admin
      .from('story_group_articles')
      .select('article_id, story_group_id')
      .in('article_id', articleIds)
      .returns<Array<{ article_id: string; story_group_id: string }>>();

    assertSupabaseSuccess(linksError);
    const groupIds = Array.from(
      new Set((links ?? []).map((link) => link.story_group_id)),
    );
    if (groupIds.length === 0) {
      return new Map();
    }

    const [{ data: groups, error: groupsError }, { data: sources, error: sourcesError }] =
      await Promise.all([
        this.supabase.admin
          .from('story_groups')
          .select('id, canonical_title, representative_article_id')
          .in('id', groupIds)
          .returns<
            Array<{
              id: string;
              canonical_title: string;
              representative_article_id: string | null;
            }>
          >(),
        this.supabase.admin
          .from('story_group_articles')
          .select(
            'story_group_id, article_id, source, url, article:articles(thumbnail_url, published_at)',
          )
          .in('story_group_id', groupIds)
          .returns<
            Array<{
              story_group_id: string;
              article_id: string;
              source: string;
              url: string | null;
              article:
                | { thumbnail_url: string | null; published_at: string | null }
                | Array<{ thumbnail_url: string | null; published_at: string | null }>
                | null;
            }>
          >(),
      ]);

    assertSupabaseSuccess(groupsError);
    assertSupabaseSuccess(sourcesError);
    const groupsById = new Map((groups ?? []).map((group) => [group.id, group]));
    const sourcesByGroup = new Map<string, RelatedSource[]>();
    const sourceRowsByGroup = new Map<string, typeof sources>();

    for (const source of sources ?? []) {
      const existing = sourcesByGroup.get(source.story_group_id) ?? [];
      if (!existing.some((item) => item.source === source.source)) {
        existing.push({ source: source.source, url: source.url });
      }
      sourcesByGroup.set(source.story_group_id, existing);
      const sourceRows = sourceRowsByGroup.get(source.story_group_id) ?? [];
      sourceRows.push(source);
      sourceRowsByGroup.set(source.story_group_id, sourceRows);
    }

    return new Map(
      (links ?? []).flatMap((link) => {
        const group = groupsById.get(link.story_group_id);
        const sourceRows = sourceRowsByGroup.get(link.story_group_id) ?? [];
        const representative = sourceRows.find(
          (source) => source.article_id === group?.representative_article_id,
        );
        const thumbnail = sourceRows
          .map((source) => linkedArticle(source.article)?.thumbnail_url ?? null)
          .find(Boolean);
        const publishedDates = sourceRows
          .map((source) => linkedArticle(source.article)?.published_at ?? null)
          .filter((date): date is string => Boolean(date))
          .sort();
        return group
          ? [
              [
                link.article_id,
                {
                  storyGroupId: group.id,
                  storyTitle: group.canonical_title,
                  representativeArticleId: group.representative_article_id,
                  representativeSource: representative?.source ?? null,
                  representativeUrl: representative?.url ?? null,
                  storyThumbnailUrl: thumbnail ?? null,
                  latestPublishedAt:
                    publishedDates[publishedDates.length - 1] ?? null,
                  relatedSources: sourcesByGroup.get(group.id) ?? [],
                },
              ] as const,
            ]
          : [];
      }),
    );
  }
}

function linkedArticle(
  article:
    | { thumbnail_url: string | null; published_at: string | null }
    | Array<{ thumbnail_url: string | null; published_at: string | null }>
    | null,
) {
  return Array.isArray(article) ? article[0] : article;
}

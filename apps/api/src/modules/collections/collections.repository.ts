import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicSignalArticle } from '@personal-newspaper/contracts';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { ArticlesRepository } from '../articles/articles.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { SaveArticleDto } from './dto/save-article.dto';

interface CollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetailRecord extends CollectionRecord {
  items: Array<{
    article: PublicSignalArticle;
    note: string | null;
    savedAt: string;
  }>;
}

@Injectable()
export class CollectionsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly articles: ArticlesRepository,
  ) {}

  async list(userId: string): Promise<CollectionRecord[]> {
    const { data, error } = await this.supabase.admin
      .from('collections')
      .select('id, user_id, name, description, is_public, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .returns<CollectionRow[]>();

    assertSupabaseSuccess(error);

    const collections = data ?? [];
    const counts = await this.countItems(collections.map((collection) => collection.id));

    return collections.map((collection) => mapCollection(collection, counts));
  }

  async getDetail(userId: string, collectionId: string): Promise<CollectionDetailRecord> {
    const collection = await this.getOwnedCollection(userId, collectionId);
    const counts = await this.countItems([collectionId]);

    const { data, error } = await this.supabase.admin
      .from('collection_items')
      .select('article_id, note, saved_at')
      .eq('collection_id', collectionId)
      .order('saved_at', { ascending: false })
      .returns<Array<{ article_id: string; note: string | null; saved_at: string }>>();

    assertSupabaseSuccess(error);

    const items = await Promise.all(
      (data ?? []).map(async (item) => ({
        article: await this.articles.findArticleById(item.article_id),
        note: item.note,
        savedAt: item.saved_at,
      })),
    );

    return {
      ...mapCollection(collection, counts),
      items,
    };
  }

  async create(userId: string, dto: CreateCollectionDto): Promise<CollectionRecord> {
    const { data, error } = await this.supabase.admin
      .from('collections')
      .insert({
        user_id: userId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        is_public: dto.isPublic ?? false,
      })
      .select('id, user_id, name, description, is_public, created_at, updated_at')
      .single<CollectionRow>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new NotFoundException('Collection was not created');
    }

    return mapCollection(data, new Map());
  }

  async saveArticle(
    userId: string,
    collectionId: string,
    dto: SaveArticleDto,
  ): Promise<{ collectionId: string; articleId: string; savedAt: string }> {
    await this.getOwnedCollection(userId, collectionId);
    await this.articles.findArticleById(dto.articleId);

    const savedAt = new Date().toISOString();
    const { error } = await this.supabase.admin.from('collection_items').upsert(
      {
        collection_id: collectionId,
        article_id: dto.articleId,
        note: dto.note?.trim() || null,
        saved_at: savedAt,
      },
      { onConflict: 'collection_id,article_id' },
    );

    assertSupabaseSuccess(error);

    return {
      collectionId,
      articleId: dto.articleId,
      savedAt,
    };
  }

  async removeArticle(userId: string, collectionId: string, articleId: string) {
    await this.getOwnedCollection(userId, collectionId);

    const { error } = await this.supabase.admin
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('article_id', articleId);

    assertSupabaseSuccess(error);
  }

  private async getOwnedCollection(
    userId: string,
    collectionId: string,
  ): Promise<CollectionRow> {
    const { data, error } = await this.supabase.admin
      .from('collections')
      .select('id, user_id, name, description, is_public, created_at, updated_at')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .maybeSingle<CollectionRow>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new NotFoundException('Collection not found');
    }

    return data;
  }

  private async countItems(collectionIds: string[]): Promise<Map<string, number>> {
    if (collectionIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.admin
      .from('collection_items')
      .select('collection_id')
      .in('collection_id', collectionIds)
      .returns<Array<{ collection_id: string }>>();

    assertSupabaseSuccess(error);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
    }

    return counts;
  }
}

function mapCollection(
  row: CollectionRow,
  counts: Map<string, number>,
): CollectionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    itemCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

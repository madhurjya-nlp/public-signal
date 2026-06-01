import { Injectable } from '@nestjs/common';
import { CollectionsRepository } from './collections.repository';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { SaveArticleDto } from './dto/save-article.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly collections: CollectionsRepository) {}

  async list(userId: string) {
    return {
      collections: await this.collections.list(userId),
    };
  }

  async getDetail(userId: string, collectionId: string) {
    return this.collections.getDetail(userId, collectionId);
  }

  async create(userId: string, dto: CreateCollectionDto) {
    return this.collections.create(userId, dto);
  }

  async saveArticle(userId: string, collectionId: string, dto: SaveArticleDto) {
    return this.collections.saveArticle(userId, collectionId, dto);
  }

  async removeArticle(userId: string, collectionId: string, articleId: string) {
    await this.collections.removeArticle(userId, collectionId, articleId);
    return { removed: true };
  }
}

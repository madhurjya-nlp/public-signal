import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser = require('rss-parser');
import {
  getEnabledApprovedSources,
  IngestionSource,
} from '../../common/public-signal/source-registry';
import { UsersRepository } from '../users/users.repository';
import { StoriesService } from '../stories/stories.service';
import { ArticlesRepository } from './articles.repository';
import { ingestRssSource } from './rss-source-ingestion';

@Injectable()
export class ArticlesService {
  private readonly parser = new Parser();

  constructor(
    private readonly articles: ArticlesRepository,
    private readonly users: UsersRepository,
    private readonly config: ConfigService,
    private readonly stories: StoriesService,
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
    return ingestRssSource({
      source,
      articles: this.articles,
      parser: this.parser,
      limit: 100,
      assignStory: (article) => this.stories.assignArticle(article),
    });
  }
}

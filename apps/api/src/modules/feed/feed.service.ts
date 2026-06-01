import { Injectable } from '@nestjs/common';
import { ArticlesRepository } from '../articles/articles.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class FeedService {
  constructor(
    private readonly articles: ArticlesRepository,
    private readonly users: UsersRepository,
  ) {}

  async getToday(userId: string) {
    const profile = await this.users.getProfile(userId);
    const articles = await this.articles.findFeedForUser({
      userId,
      interests: profile.interests,
      limit: 20,
    });

    return {
      editionDate: new Date().toISOString().slice(0, 10),
      editorNote: buildEditorNote(profile.interests),
      items: articles.map((article) => ({
        id: article.id,
        article,
        score: 0,
        reasons: article.categories.length
          ? [`Matched public signal category: ${article.categories[0]}`]
          : ['Included as a current public signal'],
      })),
    };
  }
}

function buildEditorNote(interests: string[]): string {
  if (interests.length === 0) {
    return 'Select interests to shape your first personal edition.';
  }

  const selected = interests.slice(0, 3).join(', ');
  return `Today's edition is shaped around ${selected}.`;
}

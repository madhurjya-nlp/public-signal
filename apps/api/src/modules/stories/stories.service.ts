import { Injectable } from '@nestjs/common';
import {
  normalizeStoryTitle,
  shouldClusterArticleWithStory,
  storyMatchScore,
} from './story-clustering';
import { StoriesRepository, StoryArticleInput, StoryGroupRow } from './stories.repository';

export interface StoryAssignmentResult {
  groupId: string;
  groupCreated: boolean;
  linkCreated: boolean;
}

@Injectable()
export class StoriesService {
  constructor(private readonly stories: StoriesRepository) {}

  async assignArticle(article: StoryArticleInput): Promise<StoryAssignmentResult> {
    const existingGroupId = await this.stories.findLinkByArticleId(article.id);
    if (existingGroupId) {
      return {
        groupId: existingGroupId,
        groupCreated: false,
        linkCreated: false,
      };
    }

    const candidates = await this.stories.findRecentGroups();
    const matchingGroup = findBestMatchingGroup(article, candidates);
    const group =
      matchingGroup ??
      (await this.stories.createGroup({
        canonicalTitle: article.title,
        normalizedTitle: normalizeStoryTitle(article.title),
        representativeArticleId: article.id,
        primaryCategory: article.categories[0] ?? null,
        publishedAt: article.publishedAt,
      }));
    const linkCreated = await this.stories.linkArticle(group.id, article);
    await this.stories.refreshGroup(group.id);

    return {
      groupId: group.id,
      groupCreated: !matchingGroup,
      linkCreated,
    };
  }
}

function findBestMatchingGroup(
  article: StoryArticleInput,
  candidates: StoryGroupRow[],
): StoryGroupRow | null {
  return candidates
    .filter((candidate) => shouldClusterArticleWithStory(article, candidate))
    .sort((a, b) => storyMatchScore(article, b) - storyMatchScore(article, a))[0] ?? null;
}

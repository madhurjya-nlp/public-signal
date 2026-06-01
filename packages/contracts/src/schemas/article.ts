import { z } from 'zod';

export const InterestCategorySchema = z.enum([
  'science',
  'history',
  'technology',
  'culture',
  'politics',
  'business',
  'environment',
]);

export const VoteTypeSchema = z.enum([
  'critical',
  'worth_knowing',
  'not_important',
]);

export const RelatedSourceSchema = z.object({
  source: z.string(),
  url: z.string().url().nullable(),
});

export const PublicSignalArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  thumbnail_url: z.string().url().nullable(),
  published_at: z.string().datetime().nullable(),
  summary: z.string().nullable(),
  categories: z.array(InterestCategorySchema),
  created_at: z.string().datetime(),
  story_group_id: z.string().uuid().nullable(),
  story_title: z.string(),
  related_sources: z.array(RelatedSourceSchema),
});

export const FeedResponseSchema = z.object({
  items: z.array(PublicSignalArticleSchema),
});

export const VoteResponseSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string().uuid(),
  voteType: VoteTypeSchema,
  createdAt: z.string().datetime(),
});

export const SaveArticleResponseSchema = z.object({
  article_id: z.string().uuid(),
  saved: z.boolean(),
});

export const SkipArticleResponseSchema = z.object({
  article_id: z.string().uuid(),
  skipped: z.boolean(),
});

export const SavedArticleItemSchema = z.object({
  article: PublicSignalArticleSchema,
  saved_at: z.string().datetime(),
});

export const SavedArticlesResponseSchema = z.object({
  items: z.array(SavedArticleItemSchema),
});

export const VotedArticleItemSchema = z.object({
  article: PublicSignalArticleSchema,
  vote_type: VoteTypeSchema,
  created_at: z.string().datetime(),
});

export const VotedArticlesResponseSchema = z.object({
  items: z.array(VotedArticleItemSchema),
});

export const SkippedArticleItemSchema = z.object({
  article: PublicSignalArticleSchema,
  skipped_at: z.string().datetime(),
});

export const SkippedArticlesResponseSchema = z.object({
  items: z.array(SkippedArticleItemSchema),
});

export const UserAnalyticsSchema = z.object({
  total_votes: z.number().int().nonnegative(),
  critical_votes: z.number().int().nonnegative(),
  worth_knowing_votes: z.number().int().nonnegative(),
  not_important_votes: z.number().int().nonnegative(),
  skipped_articles: z.number().int().nonnegative(),
  saved_articles: z.number().int().nonnegative(),
  unique_sources_voted: z.number().int().nonnegative(),
  unique_story_groups_voted: z.number().int().nonnegative(),
  top_interests: z.array(
    z.object({
      interest: InterestCategorySchema,
      votes: z.number().int().nonnegative(),
    }),
  ),
  recent_activity: z.array(
    z.object({
      type: z.enum(['vote', 'save', 'skip']),
      vote_type: VoteTypeSchema.optional(),
      article_id: z.string().uuid(),
      story_title: z.string(),
      source: z.string(),
      created_at: z.string().datetime(),
    }),
  ),
});

export const VoteCountsSchema = z.object({
  critical: z.number().int().nonnegative(),
  worthKnowing: z.number().int().nonnegative(),
  notImportant: z.number().int().nonnegative(),
});

export const RankingItemSchema = PublicSignalArticleSchema.extend({
  representative_article_id: z.string().uuid(),
  rankingScore: z.number().int(),
  voteCounts: VoteCountsSchema,
  totalVotes: z.number().int().nonnegative(),
});

export const DailyRankingsResponseSchema = z.object({
  most_important: z.array(RankingItemSchema),
  most_ignored: z.array(RankingItemSchema),
  most_divisive: z.array(RankingItemSchema),
});

export type InterestCategory = z.infer<typeof InterestCategorySchema>;
export type VoteType = z.infer<typeof VoteTypeSchema>;
export type RelatedSource = z.infer<typeof RelatedSourceSchema>;
export type PublicSignalArticle = z.infer<typeof PublicSignalArticleSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
export type VoteResponse = z.infer<typeof VoteResponseSchema>;
export type SaveArticleResponse = z.infer<typeof SaveArticleResponseSchema>;
export type SkipArticleResponse = z.infer<typeof SkipArticleResponseSchema>;
export type SavedArticleItem = z.infer<typeof SavedArticleItemSchema>;
export type SavedArticlesResponse = z.infer<typeof SavedArticlesResponseSchema>;
export type VotedArticleItem = z.infer<typeof VotedArticleItemSchema>;
export type VotedArticlesResponse = z.infer<typeof VotedArticlesResponseSchema>;
export type SkippedArticleItem = z.infer<typeof SkippedArticleItemSchema>;
export type SkippedArticlesResponse = z.infer<typeof SkippedArticlesResponseSchema>;
export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>;
export type RankingItem = z.infer<typeof RankingItemSchema>;
export type DailyRankingsResponse = z.infer<typeof DailyRankingsResponseSchema>;

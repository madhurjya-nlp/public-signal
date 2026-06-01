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
export type RankingItem = z.infer<typeof RankingItemSchema>;
export type DailyRankingsResponse = z.infer<typeof DailyRankingsResponseSchema>;

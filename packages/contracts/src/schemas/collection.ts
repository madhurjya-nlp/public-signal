import { z } from 'zod';

export const CollectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const SaveArticleRequestSchema = z.object({
  articleId: z.string().uuid(),
  note: z.string().max(1000).optional(),
});

export type Collection = z.infer<typeof CollectionSchema>;
export type CreateCollectionRequest = z.infer<typeof CreateCollectionRequestSchema>;
export type SaveArticleRequest = z.infer<typeof SaveArticleRequestSchema>;


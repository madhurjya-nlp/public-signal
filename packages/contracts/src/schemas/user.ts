import { z } from 'zod';
import { InterestCategorySchema } from './article';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  interests: z.array(InterestCategorySchema),
  suppressedTopics: z.array(z.string()),
});

export const UpdateInterestsRequestSchema = z.object({
  interests: z.array(InterestCategorySchema).max(7),
  suppressedTopics: z.array(z.string().min(1).max(80)).max(50).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateInterestsRequest = z.infer<typeof UpdateInterestsRequestSchema>;

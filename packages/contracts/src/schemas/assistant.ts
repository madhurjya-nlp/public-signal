import { z } from 'zod';

export const AssistantMessageRequestSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const AssistantCitationSchema = z.object({
  articleId: z.string().uuid().nullable(),
  collectionId: z.string().uuid().nullable(),
  title: z.string(),
  url: z.string().url().nullable(),
});

export const AssistantMessageResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(AssistantCitationSchema),
});

export type AssistantMessageRequest = z.infer<typeof AssistantMessageRequestSchema>;
export type AssistantMessageResponse = z.infer<typeof AssistantMessageResponseSchema>;


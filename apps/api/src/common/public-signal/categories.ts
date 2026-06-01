export const INTEREST_CATEGORIES = [
  'science',
  'history',
  'technology',
  'culture',
  'politics',
  'business',
  'environment',
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

export function isInterestCategory(value: string): value is InterestCategory {
  return INTEREST_CATEGORIES.includes(value as InterestCategory);
}


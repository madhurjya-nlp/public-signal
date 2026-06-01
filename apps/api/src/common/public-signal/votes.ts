export const VOTE_TYPES = [
  'critical',
  'worth_knowing',
  'not_important',
] as const;

export type VoteType = (typeof VOTE_TYPES)[number];

export const VOTE_POINTS: Record<VoteType, number> = {
  critical: 3,
  worth_knowing: 1,
  not_important: -1,
};

export function isVoteType(value: string): value is VoteType {
  return VOTE_TYPES.includes(value as VoteType);
}


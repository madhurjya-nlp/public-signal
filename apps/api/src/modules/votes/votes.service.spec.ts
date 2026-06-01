import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VotesService } from './votes.service';

describe('VotesService', () => {
  it('creates or updates a vote through the repository', async () => {
    const upsertVote = jest.fn().mockResolvedValue({
      id: 'vote-1',
      articleId: '00000000-0000-0000-0000-000000000001',
      voteType: 'critical',
    });
    const service = new VotesService(
      { upsertVote } as never,
      { exists: jest.fn().mockResolvedValue(true) } as never,
      { getProfile: jest.fn().mockResolvedValue({ id: 'user-1' }) } as never,
    );

    const result = await service.submitVote('user-1', {
      article_id: '00000000-0000-0000-0000-000000000001',
      vote_type: 'critical',
    });

    expect(result.voteType).toBe('critical');
    expect(upsertVote).toHaveBeenCalledWith({
      userId: 'user-1',
      articleId: '00000000-0000-0000-0000-000000000001',
      voteType: 'critical',
    });
  });

  it('rejects invalid vote types', async () => {
    const service = new VotesService(
      { upsertVote: jest.fn() } as never,
      { exists: jest.fn() } as never,
      { getProfile: jest.fn() } as never,
    );

    await expect(
      service.submitVote('user-1', {
        article_id: '00000000-0000-0000-0000-000000000001',
        vote_type: 'bad',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects votes for missing articles', async () => {
    const service = new VotesService(
      { upsertVote: jest.fn() } as never,
      { exists: jest.fn().mockResolvedValue(false) } as never,
      { getProfile: jest.fn().mockResolvedValue({ id: 'user-1' }) } as never,
    );

    await expect(
      service.submitVote('user-1', {
        article_id: '00000000-0000-0000-0000-000000000001',
        vote_type: 'critical',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});


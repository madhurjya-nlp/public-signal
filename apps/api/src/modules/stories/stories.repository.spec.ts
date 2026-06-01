import { StoriesRepository } from './stories.repository';

describe('StoriesRepository', () => {
  it('refreshes source_count using distinct linked sources', async () => {
    const update = jest.fn().mockReturnThis();
    const returns = jest.fn().mockResolvedValue({
        data: [
          {
            source: 'Example Source',
            article: { published_at: '2026-06-01T08:00:00.000Z' },
          },
          {
            source: 'Example Source',
            article: { published_at: '2026-06-01T09:00:00.000Z' },
          },
          {
            source: 'Second Source',
            article: { published_at: '2026-06-01T10:00:00.000Z' },
          },
        ],
        error: null,
      });
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const repository = new StoriesRepository({
      admin: {
        from: jest.fn((table: string) => {
          if (table === 'story_group_articles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              returns,
            };
          }

          return { update, eq: updateEq };
        }),
      },
    } as never);

    await repository.refreshGroup('30000000-0000-0000-0000-000000000001');

    expect(update).toHaveBeenCalledWith({
      source_count: 2,
      first_published_at: '2026-06-01T08:00:00.000Z',
      latest_published_at: '2026-06-01T10:00:00.000Z',
    });
  });
});

import { StoriesService } from './stories.service';
import { StoryArticleInput } from './stories.repository';

const article: StoryArticleInput = {
  id: '20000000-0000-0000-0000-000000000001',
  title: 'India launches new lunar mission',
  url: 'https://example.com/lunar-mission',
  sourceName: 'Example Source',
  publishedAt: '2026-06-01T10:00:00.000Z',
  categories: ['science'],
};

describe('StoriesService', () => {
  it('creates and links a group for an unmatched article', async () => {
    const refreshGroup = jest.fn().mockResolvedValue(undefined);
    const service = new StoriesService({
      findLinkByArticleId: jest.fn().mockResolvedValue(null),
      findRecentGroups: jest.fn().mockResolvedValue([]),
      createGroup: jest.fn().mockResolvedValue({
        id: '30000000-0000-0000-0000-000000000001',
      }),
      linkArticle: jest.fn().mockResolvedValue(true),
      refreshGroup,
    } as never);

    await expect(service.assignArticle(article)).resolves.toEqual({
      groupId: '30000000-0000-0000-0000-000000000001',
      groupCreated: true,
      linkCreated: true,
    });
    expect(refreshGroup).toHaveBeenCalledWith(
      '30000000-0000-0000-0000-000000000001',
    );
  });

  it('does not link the same article twice', async () => {
    const linkArticle = jest.fn();
    const service = new StoriesService({
      findLinkByArticleId: jest
        .fn()
        .mockResolvedValue('30000000-0000-0000-0000-000000000001'),
      linkArticle,
    } as never);

    await expect(service.assignArticle(article)).resolves.toEqual({
      groupId: '30000000-0000-0000-0000-000000000001',
      groupCreated: false,
      linkCreated: false,
    });
    expect(linkArticle).not.toHaveBeenCalled();
  });

  it('links a similar headline to an existing recent group', async () => {
    const createGroup = jest.fn();
    const linkArticle = jest.fn().mockResolvedValue(true);
    const service = new StoriesService({
      findLinkByArticleId: jest.fn().mockResolvedValue(null),
      findRecentGroups: jest.fn().mockResolvedValue([
        {
          id: '30000000-0000-0000-0000-000000000001',
          normalized_title: 'india launches new lunar mission',
          latest_published_at: '2026-06-01T09:00:00.000Z',
          primary_category: 'science',
        },
      ]),
      createGroup,
      linkArticle,
      refreshGroup: jest.fn().mockResolvedValue(undefined),
    } as never);

    const result = await service.assignArticle({
      ...article,
      id: '20000000-0000-0000-0000-000000000002',
      sourceName: 'Second Source',
    });

    expect(result.groupCreated).toBe(false);
    expect(createGroup).not.toHaveBeenCalled();
    expect(linkArticle).toHaveBeenCalledWith(
      '30000000-0000-0000-0000-000000000001',
      expect.objectContaining({ sourceName: 'Second Source' }),
    );
  });
});

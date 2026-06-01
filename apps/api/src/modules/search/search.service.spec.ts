import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SearchService } from './search.service';

describe('SearchService', () => {
  it('rejects placeholder access when disabled', async () => {
    const service = new SearchService({
      get: jest.fn((key: string) => {
        if (key === 'SEARCH_ENABLED') {
          return 'false';
        }
        return 'production';
      }),
    } as never);

    await expect(
      service.searchAll('user-1', 'climate'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates the search query when explicitly enabled', async () => {
    const service = new SearchService({
      get: jest.fn((key: string) =>
        key === 'SEARCH_ENABLED' ? 'true' : 'development'
      ),
    } as never);

    await expect(service.searchAll('user-1', '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

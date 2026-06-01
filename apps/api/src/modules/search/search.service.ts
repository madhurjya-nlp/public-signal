import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  async searchAll(userId: string, query?: string) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    return {
      userId,
      query: normalizedQuery,
      results: [],
    };
  }
}


import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseBooleanFlag } from '../../common/config/runtime-config';

@Injectable()
export class SearchService {
  constructor(private readonly config: ConfigService) {}

  async searchAll(userId: string, query?: string) {
    if (!parseBooleanFlag(this.config.get<string>('SEARCH_ENABLED'), false)) {
      throw new NotFoundException();
    }

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

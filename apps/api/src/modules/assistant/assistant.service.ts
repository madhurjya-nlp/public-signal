import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseBooleanFlag } from '../../common/config/runtime-config';

@Injectable()
export class AssistantService {
  constructor(private readonly config: ConfigService) {}

  async sendMessage(userId: string, message: string) {
    if (!parseBooleanFlag(this.config.get<string>('ASSISTANT_ENABLED'), false)) {
      throw new NotFoundException();
    }

    return {
      userId,
      message,
      answer:
        'Assistant RAG is not connected yet. This endpoint is reserved for retrieval over saved articles, notes, and collections.',
      citations: [],
    };
  }
}

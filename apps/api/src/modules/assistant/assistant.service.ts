import { Injectable } from '@nestjs/common';

@Injectable()
export class AssistantService {
  async sendMessage(userId: string, message: string) {
    return {
      userId,
      message,
      answer:
        'Assistant RAG is not connected yet. This endpoint is reserved for retrieval over saved articles, notes, and collections.',
      citations: [],
    };
  }
}


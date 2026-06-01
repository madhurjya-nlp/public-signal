import { NotFoundException } from '@nestjs/common';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  it('rejects placeholder access when disabled', async () => {
    const service = new AssistantService({
      get: jest.fn((key: string) => {
        if (key === 'ASSISTANT_ENABLED') {
          return 'false';
        }
        return 'production';
      }),
    } as never);

    await expect(
      service.sendMessage('user-1', 'What happened?'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the placeholder response when explicitly enabled', async () => {
    const service = new AssistantService({
      get: jest.fn((key: string) =>
        key === 'ASSISTANT_ENABLED' ? 'true' : 'development'
      ),
    } as never);

    await expect(
      service.sendMessage('user-1', 'What happened?'),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'user-1',
        message: 'What happened?',
        citations: [],
      }),
    );
  });
});

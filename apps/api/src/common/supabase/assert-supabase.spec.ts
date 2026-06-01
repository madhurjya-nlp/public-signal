import { InternalServerErrorException, Logger } from '@nestjs/common';
import { assertSupabaseSuccess } from './assert-supabase';

describe('assertSupabaseSuccess', () => {
  it('throws a sanitized error and logs internal details', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    let thrownError: unknown;

    try {
      assertSupabaseSuccess({
        message: 'relation "private_table" does not exist',
        code: '42P01',
        details: 'schema detail',
        hint: 'internal hint',
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(InternalServerErrorException);
    expect((thrownError as InternalServerErrorException).message).toBe(
      'Database operation failed',
    );
    expect(loggerSpy).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});

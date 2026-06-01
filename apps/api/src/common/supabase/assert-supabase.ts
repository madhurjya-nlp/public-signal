import { InternalServerErrorException, Logger } from '@nestjs/common';

interface SupabaseLikeError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

const logger = new Logger('Supabase');

export function assertSupabaseSuccess(error: SupabaseLikeError | null) {
  if (error) {
    logger.error(
      'Supabase request failed',
      JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw new InternalServerErrorException('Database operation failed');
  }
}

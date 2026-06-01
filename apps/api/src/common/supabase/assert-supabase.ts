import { InternalServerErrorException } from '@nestjs/common';

export function assertSupabaseSuccess(error: { message: string } | null) {
  if (error) {
    throw new InternalServerErrorException(error.message);
  }
}


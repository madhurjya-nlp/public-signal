import { Global, Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/auth/supabase-auth.guard';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService, SupabaseAuthGuard],
  exports: [SupabaseService, SupabaseAuthGuard],
})
export class SupabaseModule {}

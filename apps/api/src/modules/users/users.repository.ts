import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { isInterestCategory } from '../../common/public-signal/categories';

export interface UserProfileRecord {
  id: string;
  displayName: string | null;
  interests: string[];
  suppressedTopics: string[];
}

@Injectable()
export class UsersRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string): Promise<UserProfileRecord> {
    await this.ensureProfile(userId);

    const [{ data: profile, error: profileError }, interests, suppressedTopics] =
      await Promise.all([
        this.supabase.admin
          .from('profiles')
          .select('id, display_name')
          .eq('id', userId)
          .single(),
        this.getInterests(userId),
        this.getSuppressedTopics(userId),
      ]);

    assertSupabaseSuccess(profileError);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      displayName: profile.display_name,
      interests,
      suppressedTopics,
    };
  }

  async updateInterests(
    userId: string,
    interests: string[],
    suppressedTopics: string[],
  ): Promise<UserProfileRecord> {
    const normalizedInterests = normalizeTopics(interests).filter(isInterestCategory);
    const normalizedSuppressed = normalizeTopics(suppressedTopics);

    await this.ensureProfile(userId);

    const [{ error: interestsDeleteError }, { error: suppressedDeleteError }] =
      await Promise.all([
        this.supabase.admin.from('user_interests').delete().eq('user_id', userId),
        this.supabase.admin
          .from('user_suppressed_topics')
          .delete()
          .eq('user_id', userId),
      ]);

    assertSupabaseSuccess(interestsDeleteError);
    assertSupabaseSuccess(suppressedDeleteError);

    if (normalizedInterests.length > 0) {
      const { error } = await this.supabase.admin.from('user_interests').insert(
        normalizedInterests.map((topic) => ({
          user_id: userId,
          topic,
        })),
      );
      assertSupabaseSuccess(error);
    }

    if (normalizedSuppressed.length > 0) {
      const { error } = await this.supabase.admin
        .from('user_suppressed_topics')
        .insert(
          normalizedSuppressed.map((topic) => ({
            user_id: userId,
            topic,
          })),
        );
      assertSupabaseSuccess(error);
    }

    const { error: updateError } = await this.supabase.admin
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);
    assertSupabaseSuccess(updateError);

    return this.getProfile(userId);
  }

  private async ensureProfile(userId: string) {
    const { error } = await this.supabase.admin.from('profiles').upsert(
      {
        id: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    assertSupabaseSuccess(error);
  }

  private async getInterests(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.admin
      .from('user_interests')
      .select('topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    assertSupabaseSuccess(error);
    return (data ?? []).map((row) => row.topic);
  }

  private async getSuppressedTopics(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.admin
      .from('user_suppressed_topics')
      .select('topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    assertSupabaseSuccess(error);
    return (data ?? []).map((row) => row.topic);
  }
}

function normalizeTopics(topics: string[]): string[] {
  return Array.from(
    new Set(
      topics
        .map((topic) => topic.trim())
        .filter((topic) => topic.length > 0)
        .map((topic) => topic.toLowerCase()),
    ),
  );
}

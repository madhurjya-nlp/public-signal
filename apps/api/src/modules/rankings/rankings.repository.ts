import { Injectable } from '@nestjs/common';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { VoteType } from '../../common/public-signal/votes';
import { SupabaseService } from '../supabase/supabase.service';

export interface DailyVoteRow {
  vote_type: VoteType;
  article:
    | {
        id: string;
        headline: string;
        canonical_url: string;
        thumbnail_url: string | null;
        published_at: string | null;
        summary: string | null;
        categories: string[] | null;
        created_at: string;
        source:
          | {
              name: string;
            }
          | Array<{
              name: string;
            }>
          | null;
      }
    | Array<{
        id: string;
        headline: string;
        canonical_url: string;
        thumbnail_url: string | null;
        published_at: string | null;
        summary: string | null;
        categories: string[] | null;
        created_at: string;
        source:
          | {
              name: string;
            }
          | Array<{
              name: string;
            }>
          | null;
      }>
    | null;
}

@Injectable()
export class RankingsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async findVotesBetween(start: string, end: string): Promise<DailyVoteRow[]> {
    const { data, error } = await this.supabase.admin
      .from('article_votes')
      .select(
        `
          vote_type,
          article:articles(
            id,
            headline,
            canonical_url,
            thumbnail_url,
            published_at,
            summary,
            categories,
            created_at,
            source:sources(name)
          )
        `,
      )
      .gte('created_at', start)
      .lt('created_at', end)
      .returns<DailyVoteRow[]>();

    assertSupabaseSuccess(error);
    return data ?? [];
  }
}


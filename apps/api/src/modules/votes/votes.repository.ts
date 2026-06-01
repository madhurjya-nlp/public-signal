import { Injectable } from '@nestjs/common';
import { assertSupabaseSuccess } from '../../common/supabase/assert-supabase';
import { VoteType } from '../../common/public-signal/votes';
import { SupabaseService } from '../supabase/supabase.service';

interface VoteRow {
  id: string;
  article_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface VoteRecord {
  id: string;
  articleId: string;
  voteType: VoteType;
  createdAt: string;
}

@Injectable()
export class VotesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async upsertVote(params: {
    userId: string;
    articleId: string;
    voteType: VoteType;
  }): Promise<VoteRecord> {
    const { data, error } = await this.supabase.admin
      .from('article_votes')
      .upsert(
        {
          user_id: params.userId,
          article_id: params.articleId,
          vote_type: params.voteType,
        },
        { onConflict: 'user_id,article_id' },
      )
      .select('id, article_id, vote_type, created_at')
      .single<VoteRow>();

    assertSupabaseSuccess(error);

    if (!data) {
      throw new Error('Vote was not saved');
    }

    return {
      id: data.id,
      articleId: data.article_id,
      voteType: data.vote_type,
      createdAt: data.created_at,
    };
  }
}


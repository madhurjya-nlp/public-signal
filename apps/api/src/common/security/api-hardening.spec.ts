import { GUARDS_METADATA } from '@nestjs/common/constants';
import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ArticlesController } from '../../modules/articles/articles.controller';
import { VotesController } from '../../modules/votes/votes.controller';
import { ArticleActionsController } from '../../modules/user-actions/user-actions.controller';
import { SearchController } from '../../modules/search/search.controller';
import { AssistantController } from '../../modules/assistant/assistant.controller';

describe('API hardening metadata', () => {
  it('keeps the articles controller behind auth', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ArticlesController)).toEqual([
      SupabaseAuthGuard,
    ]);
  });

  it('applies strict throttles to sensitive routes', () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        ArticlesController.prototype.ingest,
      ),
    ).toBe(2);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        ArticlesController.prototype.ingest,
      ),
    ).toBe(60_000);

    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        VotesController.prototype.submitVote,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        ArticleActionsController.prototype.saveArticle,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        ArticleActionsController.prototype.skipArticle,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        SearchController.prototype.searchAll,
      ),
    ).toBe(10);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AssistantController.prototype.sendMessage,
      ),
    ).toBe(10);
  });
});

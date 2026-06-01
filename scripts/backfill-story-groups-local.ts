import { createClient } from '@supabase/supabase-js';
import { ArticlesRepository } from '../apps/api/src/modules/articles/articles.repository';
import { assertLocalSupabaseEnvironment } from '../apps/api/src/modules/articles/rss-source-ingestion';
import { StoriesRepository } from '../apps/api/src/modules/stories/stories.repository';
import { StoriesService } from '../apps/api/src/modules/stories/stories.service';

async function main() {
  const env = assertLocalSupabaseEnvironment(process.env);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const storiesRepository = new StoriesRepository({ admin: supabase } as never);
  const stories = new StoriesService(storiesRepository);
  const articles = new ArticlesRepository(
    { admin: supabase } as never,
    storiesRepository,
  );
  const existingArticles = await articles.findArticlesForStoryBackfill();
  let groupsCreated = 0;
  let linksCreated = 0;
  let duplicatesSkipped = 0;
  let failed = 0;

  for (const article of existingArticles) {
    try {
      const result = await stories.assignArticle(article);
      groupsCreated += result.groupCreated ? 1 : 0;
      linksCreated += result.linkCreated ? 1 : 0;
      duplicatesSkipped += result.linkCreated ? 0 : 1;
    } catch {
      failed += 1;
    }
  }

  process.stdout.write(
    [
      'Local Story Group Backfill',
      `articles_scanned: ${existingArticles.length}`,
      `groups_created: ${groupsCreated}`,
      `links_created: ${linksCreated}`,
      `duplicates_skipped: ${duplicatesSkipped}`,
      `failed: ${failed}`,
      'local_only_warning: this command only targets local Supabase',
      '',
    ].join('\n'),
  );
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

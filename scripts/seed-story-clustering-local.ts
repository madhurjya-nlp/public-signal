import { createClient } from '@supabase/supabase-js';
import {
  ArticlesRepository,
  IngestArticleInput,
} from '../apps/api/src/modules/articles/articles.repository';
import { assertLocalSupabaseEnvironment } from '../apps/api/src/modules/articles/rss-source-ingestion';
import { StoriesRepository } from '../apps/api/src/modules/stories/stories.repository';
import { StoriesService } from '../apps/api/src/modules/stories/stories.service';

const FLOOD_ARTICLE_URLS = [
  'https://local.test/assam-floods-lakhimpur-schools-1',
  'https://local.test/lakhimpur-schools-flood-waters-2',
  'https://local.test/flood-school-schedule-lakhimpur-3',
];
const CONTROL_ARTICLE_URL =
  'https://local.test/guwahati-robotics-students-4';

const SEED_ARTICLES: IngestArticleInput[] = [
  {
    title: 'Assam floods disrupt Lakhimpur schools as waters rise',
    sourceName: 'Local Test Wire',
    url: FLOOD_ARTICLE_URLS[0],
    publishedAt: '2026-06-01T08:00:00.000Z',
    categories: ['environment'],
  },
  {
    title: 'Lakhimpur schools disrupted by Assam floods as waters rise',
    sourceName: 'Regional Test News',
    url: FLOOD_ARTICLE_URLS[1],
    publishedAt: '2026-06-01T09:00:00.000Z',
    categories: ['environment'],
  },
  {
    title: 'Assam floods disrupt Lakhimpur schools as waters rise today',
    sourceName: 'Civic Test Desk',
    url: FLOOD_ARTICLE_URLS[2],
    publishedAt: '2026-06-01T10:00:00.000Z',
    categories: ['environment'],
  },
  {
    title: 'Technology students build robotics project in Guwahati',
    sourceName: 'Education Test Desk',
    url: CONTROL_ARTICLE_URL,
    publishedAt: '2026-06-01T10:30:00.000Z',
    categories: ['technology'],
  },
];

interface PersistedSeedArticle {
  id: string;
  url: string;
}

interface StoryLinkRow {
  article_id: string;
  story_group_id: string;
  source: string;
}

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
  const persistedArticles: PersistedSeedArticle[] = [];
  let upsertedArticles = 0;
  let existingArticles = 0;
  let groupsCreated = 0;
  let linksCreated = 0;
  let duplicateLinksSkipped = 0;

  for (const seedArticle of SEED_ARTICLES) {
    const existed = await articles.existsByCanonicalUrl(seedArticle.url);
    const article = await articles.upsertIngestedArticle(seedArticle);
    const assignment = await stories.assignArticle(article);

    persistedArticles.push({ id: article.id, url: article.url });
    upsertedArticles += existed ? 0 : 1;
    existingArticles += existed ? 1 : 0;
    groupsCreated += assignment.groupCreated ? 1 : 0;
    linksCreated += assignment.linkCreated ? 1 : 0;
    duplicateLinksSkipped += assignment.linkCreated ? 0 : 1;
  }

  const persistedIds = persistedArticles.map((article) => article.id);
  const { data: links, error: linksError } = await supabase
    .from('story_group_articles')
    .select('article_id, story_group_id, source')
    .in('article_id', persistedIds)
    .returns<StoryLinkRow[]>();

  if (linksError) {
    throw linksError;
  }

  const linksByArticleId = new Map(
    (links ?? []).map((link) => [link.article_id, link]),
  );
  const idByUrl = new Map(
    persistedArticles.map((article) => [article.url, article.id]),
  );
  const floodGroupIds = new Set(
    FLOOD_ARTICLE_URLS.map((url) => linksByArticleId.get(idByUrl.get(url)!)?.story_group_id),
  );
  floodGroupIds.delete(undefined);

  const floodGroupId =
    floodGroupIds.size === 1 ? Array.from(floodGroupIds)[0] : null;
  const controlGroupId = linksByArticleId.get(
    idByUrl.get(CONTROL_ARTICLE_URL)!,
  )?.story_group_id;

  if (!floodGroupId) {
    throw new Error('Seed verification failed: flood articles did not form one story group.');
  }

  const { data: group, error: groupError } = await supabase
    .from('story_groups')
    .select('source_count')
    .eq('id', floodGroupId)
    .single<{ source_count: number }>();

  if (groupError) {
    throw groupError;
  }

  const { data: floodLinks, error: floodLinksError } = await supabase
    .from('story_group_articles')
    .select('source')
    .eq('story_group_id', floodGroupId)
    .returns<Array<{ source: string }>>();

  if (floodLinksError) {
    throw floodLinksError;
  }

  const sources = Array.from(
    new Set((floodLinks ?? []).map((link) => link.source)),
  ).sort();
  const passed =
    group.source_count >= 3 &&
    sources.length >= 3 &&
    Boolean(controlGroupId) &&
    controlGroupId !== floodGroupId;

  process.stdout.write(
    [
      'Local Story Clustering Seed Test',
      `articles_inserted: ${upsertedArticles}`,
      `articles_already_present: ${existingArticles}`,
      `story_groups_created: ${groupsCreated}`,
      `story_links_created: ${linksCreated}`,
      `duplicate_links_skipped: ${duplicateLinksSkipped}`,
      `flood_story_group_id: ${floodGroupId}`,
      `flood_group_source_count: ${group.source_count}`,
      `flood_group_sources: ${sources.join(', ')}`,
      `unrelated_article_group_id: ${controlGroupId ?? 'missing'}`,
      `result: ${passed ? 'PASS' : 'FAIL'}`,
      'local_only_warning: fake test data for local Supabase only',
      '',
    ].join('\n'),
  );

  if (!passed) {
    throw new Error('Seed verification failed.');
  }
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

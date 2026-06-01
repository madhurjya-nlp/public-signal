import Parser = require('rss-parser');
import {
  IngestionSource,
  SOURCE_REGISTRY,
} from '../../common/public-signal/source-registry';
import { ArticlesRepository } from './articles.repository';
import { mapRssItem } from './rss-item.mapper';

const DEFAULT_LOCAL_LIMIT = 20;
const MAX_LOCAL_LIMIT = 50;

interface RssFeed {
  items?: Parser.Item[];
}

interface RssParserLike {
  parseURL(url: string): Promise<RssFeed>;
}

interface RssIngestionRepository {
  existsByCanonicalUrl(url: string): Promise<boolean>;
  upsertIngestedArticle: ArticlesRepository['upsertIngestedArticle'];
}

export interface RssSourceIngestionResult {
  fetched: number;
  attempted: number;
  stored: number;
  skipped: number;
  failed: number;
  duplicate: number;
}

export interface LocalRssIngestionArgs {
  sourceId: string;
  limit: number;
}

export interface LocalSupabaseEnvironment {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function ingestRssSource(params: {
  source: IngestionSource;
  articles: RssIngestionRepository;
  parser: RssParserLike;
  limit: number;
}): Promise<RssSourceIngestionResult> {
  const feed = await params.parser.parseURL(params.source.url);
  const items = feed.items ?? [];
  const selectedItems = items.slice(0, params.limit);
  const result: RssSourceIngestionResult = {
    fetched: items.length,
    attempted: selectedItems.length,
    stored: 0,
    skipped: 0,
    failed: 0,
    duplicate: 0,
  };

  for (const item of selectedItems) {
    const input = mapRssItem(params.source, item);

    if (!input) {
      result.skipped += 1;
      continue;
    }

    try {
      const wasDuplicate = await params.articles.existsByCanonicalUrl(input.url);
      await params.articles.upsertIngestedArticle(input);

      if (wasDuplicate) {
        result.duplicate += 1;
      } else {
        result.stored += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  return result;
}

export function parseLocalRssIngestionArgs(
  args: string[],
): LocalRssIngestionArgs {
  const sourceId = readArg(args, 'source-id');
  const rawLimit = readArg(args, 'limit');

  if (!sourceId) {
    throw new Error(
      'Usage: ts-node scripts/ingest-rss-source-local.ts --source-id=<source-id> [--limit=<1-50>]',
    );
  }

  const limit = rawLimit ? Number(rawLimit) : DEFAULT_LOCAL_LIMIT;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Limit must be an integer greater than or equal to 1.');
  }

  if (limit > MAX_LOCAL_LIMIT) {
    throw new Error(`Limit must be less than or equal to ${MAX_LOCAL_LIMIT}.`);
  }

  return { sourceId, limit };
}

export function resolveManualRssSource(sourceId: string): IngestionSource {
  const source = SOURCE_REGISTRY.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }

  if (source.kind !== 'rss') {
    throw new Error(
      `Source ${source.id} is kind "${source.kind}". Local candidate ingestion only supports RSS sources.`,
    );
  }

  return source;
}

export function assertLocalSupabaseEnvironment(
  env: NodeJS.ProcessEnv,
): LocalSupabaseEnvironment {
  if (env.NODE_ENV === 'production') {
    throw new Error('Local RSS ingestion is blocked when NODE_ENV=production.');
  }

  if (!env.SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL is required and must point to local Supabase.',
    );
  }

  if (
    !env.SUPABASE_URL.includes('localhost') &&
    !env.SUPABASE_URL.includes('127.0.0.1')
  ) {
    throw new Error(
      'Local RSS ingestion is blocked because SUPABASE_URL is not localhost or 127.0.0.1.',
    );
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.');
  }

  return {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function readArg(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

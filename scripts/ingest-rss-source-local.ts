import { createClient } from '@supabase/supabase-js';
import Parser = require('rss-parser');
import { ArticlesRepository } from '../apps/api/src/modules/articles/articles.repository';
import {
  assertLocalSupabaseEnvironment,
  ingestRssSource,
  parseLocalRssIngestionArgs,
  resolveManualRssSource,
} from '../apps/api/src/modules/articles/rss-source-ingestion';

const LOCAL_INGESTION_TIMEOUT_MS = 15_000;

async function main() {
  const args = parseLocalRssIngestionArgs(process.argv.slice(2));
  const env = assertLocalSupabaseEnvironment(process.env);
  const source = resolveManualRssSource(args.sourceId);
  const initialEnabled = source.enabled;
  const initialApprovalStatus = source.approvalStatus;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const articles = new ArticlesRepository({ admin: supabase } as never);
  const parser = new Parser({ timeout: LOCAL_INGESTION_TIMEOUT_MS });
  const result = await ingestRssSource({
    source,
    articles,
    parser,
    limit: args.limit,
  });

  process.stdout.write(
    [
      'Local RSS Source Ingestion Smoke Test',
      `source_id: ${source.id}`,
      `source_name: ${source.name}`,
      `source_url: ${source.url}`,
      `enabled: ${source.enabled}`,
      `approval_status: ${source.approvalStatus}`,
      `limit: ${args.limit}`,
      `fetched: ${result.fetched}`,
      `attempted: ${result.attempted}`,
      `stored: ${result.stored}`,
      `skipped: ${result.skipped}`,
      `failed: ${result.failed}`,
      `duplicate: ${result.duplicate}`,
      'local_only_warning: this command is for local Supabase smoke testing only',
      `approval_mutated: ${source.approvalStatus !== initialApprovalStatus}`,
      `automatic_ingestion_mutated: ${source.enabled !== initialEnabled}`,
      '',
    ].join('\n'),
  );
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

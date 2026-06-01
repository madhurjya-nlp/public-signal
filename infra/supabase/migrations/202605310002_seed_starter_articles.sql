create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute procedure public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

create trigger assistant_conversations_set_updated_at
  before update on public.assistant_conversations
  for each row execute procedure public.set_updated_at();

insert into public.sources (id, name, homepage_url, rss_url, credibility_score)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Starter Review',
    'https://example.com/starter-review',
    null,
    8.50
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Knowledge Desk',
    'https://example.com/knowledge-desk',
    null,
    8.00
  )
on conflict (name) do nothing;

insert into public.articles (
  id,
  source_id,
  headline,
  canonical_url,
  thumbnail_url,
  author,
  language,
  published_at,
  reading_time_minutes,
  metadata
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Japanese Architecture Finds New Life in Small Urban Homes',
    'https://example.com/articles/japanese-architecture-small-homes',
    null,
    'Editorial Desk',
    'en',
    '2026-05-30 08:00:00+00',
    5,
    '{"starter": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'AI Regulation Moves From Principle to Enforcement',
    'https://example.com/articles/ai-regulation-enforcement',
    null,
    'Editorial Desk',
    'en',
    '2026-05-29 08:00:00+00',
    6,
    '{"starter": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Arctic Research Teams Map a Rapidly Changing Ice Frontier',
    'https://example.com/articles/arctic-research-ice-frontier',
    null,
    'Editorial Desk',
    'en',
    '2026-05-28 08:00:00+00',
    4,
    '{"starter": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Ancient Trade Routes Are Reframing How Historians Read Cities',
    'https://example.com/articles/ancient-trade-routes-cities',
    null,
    'Editorial Desk',
    'en',
    '2026-05-27 08:00:00+00',
    7,
    '{"starter": true}'::jsonb
  )
on conflict (canonical_url) do nothing;

insert into public.article_enrichments (
  article_id,
  summary,
  why_it_matters,
  topics,
  provider,
  model,
  status,
  generated_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Architects are adapting Japanese minimalism, flexible rooms, and natural materials for dense city living.',
    'This shows how architecture can respond to urban pressure without making homes feel purely functional or impersonal.',
    array['architecture', 'design', 'japan'],
    'seed',
    'starter-editorial-v1',
    'completed',
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Governments are shifting AI policy from broad safety principles toward audits, enforcement teams, and penalties.',
    'Regulation will shape which AI products can reach users and how companies prove that their systems are safe.',
    array['ai', 'startups', 'technology'],
    'seed',
    'starter-editorial-v1',
    'completed',
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Researchers are combining satellite data and field expeditions to understand fast changes in Arctic ice.',
    'Arctic change affects shipping, climate models, indigenous communities, and long-term geopolitical planning.',
    array['science', 'nature', 'geopolitics'],
    'seed',
    'starter-editorial-v1',
    'completed',
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'New archaeological and historical work is showing how trade routes shaped ancient urban life and cultural exchange.',
    'Cities become easier to understand when they are read as living networks of movement, commerce, and memory.',
    array['history', 'anthropology', 'architecture'],
    'seed',
    'starter-editorial-v1',
    'completed',
    now()
  )
on conflict (article_id) do update set
  summary = excluded.summary,
  why_it_matters = excluded.why_it_matters,
  topics = excluded.topics,
  provider = excluded.provider,
  model = excluded.model,
  status = excluded.status,
  generated_at = excluded.generated_at,
  updated_at = now();


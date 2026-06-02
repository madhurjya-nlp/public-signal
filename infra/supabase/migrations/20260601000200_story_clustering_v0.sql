create table if not exists public.story_groups (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null,
  normalized_title text not null,
  representative_article_id uuid references public.articles(id) on delete set null,
  primary_category text,
  first_published_at timestamptz,
  latest_published_at timestamptz,
  source_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_group_articles (
  story_group_id uuid not null references public.story_groups(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  source text not null,
  url text,
  created_at timestamptz not null default now(),
  primary key (story_group_id, article_id),
  unique (article_id)
);

create index if not exists story_groups_normalized_title_idx
  on public.story_groups(normalized_title);

create index if not exists story_groups_latest_published_idx
  on public.story_groups(latest_published_at desc);

create index if not exists story_group_articles_story_group_idx
  on public.story_group_articles(story_group_id);

create index if not exists story_group_articles_article_idx
  on public.story_group_articles(article_id);

create index if not exists story_group_articles_source_idx
  on public.story_group_articles(source);

alter table public.story_groups enable row level security;
alter table public.story_group_articles enable row level security;

drop policy if exists "Story groups readable by authenticated users"
  on public.story_groups;
create policy "Story groups readable by authenticated users"
  on public.story_groups for select
  using (auth.role() = 'authenticated');

drop policy if exists "Story group articles readable by authenticated users"
  on public.story_group_articles;
create policy "Story group articles readable by authenticated users"
  on public.story_group_articles for select
  using (auth.role() = 'authenticated');

drop trigger if exists story_groups_set_updated_at on public.story_groups;
create trigger story_groups_set_updated_at
  before update on public.story_groups
  for each row execute procedure public.set_updated_at();

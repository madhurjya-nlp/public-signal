create table if not exists public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  story_group_id uuid references public.story_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table if not exists public.article_skips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  story_group_id uuid references public.story_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists saved_articles_user_id_idx
  on public.saved_articles(user_id);

create index if not exists saved_articles_article_id_idx
  on public.saved_articles(article_id);

create index if not exists saved_articles_story_group_id_idx
  on public.saved_articles(story_group_id);

create index if not exists saved_articles_created_at_idx
  on public.saved_articles(created_at desc);

create index if not exists article_skips_user_id_idx
  on public.article_skips(user_id);

create index if not exists article_skips_article_id_idx
  on public.article_skips(article_id);

create index if not exists article_skips_story_group_id_idx
  on public.article_skips(story_group_id);

create index if not exists article_skips_created_at_idx
  on public.article_skips(created_at desc);

alter table public.saved_articles enable row level security;
alter table public.article_skips enable row level security;

drop policy if exists "Saved articles owned by user"
  on public.saved_articles;
create policy "Saved articles owned by user"
  on public.saved_articles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Article skips owned by user"
  on public.article_skips;
create policy "Article skips owned by user"
  on public.article_skips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

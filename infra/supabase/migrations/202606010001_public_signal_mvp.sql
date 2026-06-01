alter table public.articles
  add column if not exists categories text[] default '{}';

alter table public.articles
  add column if not exists summary text;

update public.articles
set categories = coalesce(categories, '{}');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'articles_categories_supported_check'
  ) then
    alter table public.articles
      add constraint articles_categories_supported_check
      check (
        categories is null
        or categories <@ array[
          'science',
          'history',
          'technology',
          'culture',
          'politics',
          'business',
          'environment'
        ]::text[]
      ) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_interests_supported_interest_check'
  ) then
    alter table public.user_interests
      add constraint user_interests_supported_interest_check
      check (
        topic in (
          'science',
          'history',
          'technology',
          'culture',
          'politics',
          'business',
          'environment'
        )
      ) not valid;
  end if;
end;
$$;

create table if not exists public.article_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  vote_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, article_id),
  constraint article_votes_vote_type_check
    check (vote_type in ('critical', 'worth_knowing', 'not_important'))
);

create index if not exists articles_categories_idx
  on public.articles using gin(categories);

create index if not exists article_votes_article_created_idx
  on public.article_votes(article_id, created_at desc);

create index if not exists article_votes_user_article_idx
  on public.article_votes(user_id, article_id);

alter table public.article_votes enable row level security;

drop policy if exists "Article votes owned by user" on public.article_votes;
create policy "Article votes owned by user"
  on public.article_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists article_votes_set_updated_at on public.article_votes;
create trigger article_votes_set_updated_at
  before update on public.article_votes
  for each row execute procedure public.set_updated_at();


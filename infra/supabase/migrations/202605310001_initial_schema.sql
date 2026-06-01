create extension if not exists "pgcrypto";

create type public.ai_job_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  weight numeric(5, 2) not null default 1.0,
  created_at timestamptz not null default now(),
  unique (user_id, topic)
);

create table public.user_suppressed_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now(),
  unique (user_id, topic)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  homepage_url text,
  rss_url text,
  credibility_score numeric(4, 2),
  created_at timestamptz not null default now(),
  unique (name)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  headline text not null,
  canonical_url text not null unique,
  thumbnail_url text,
  author text,
  language text not null default 'en',
  published_at timestamptz,
  reading_time_minutes integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.articles is
  'Stores article metadata and canonical links. Do not store full copyrighted article text here by default.';

create table public.article_enrichments (
  article_id uuid primary key references public.articles(id) on delete cascade,
  summary text,
  why_it_matters text,
  topics text[] not null default '{}',
  provider text,
  model text,
  status public.ai_job_status not null default 'pending',
  error_message text,
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  note text,
  saved_at timestamptz not null default now(),
  primary key (collection_id, article_id)
);

create table public.reading_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  event_type text not null,
  progress_percent integer,
  created_at timestamptz not null default now(),
  constraint reading_events_progress_check
    check (progress_percent is null or progress_percent between 0 and 100)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  token_usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index articles_source_id_idx on public.articles(source_id);
create index articles_published_at_idx on public.articles(published_at desc);
create index article_enrichments_topics_idx on public.article_enrichments using gin(topics);
create index collections_user_id_idx on public.collections(user_id);
create index collection_items_article_id_idx on public.collection_items(article_id);
create index reading_events_user_created_idx on public.reading_events(user_id, created_at desc);
create index notes_user_created_idx on public.notes(user_id, created_at desc);
create index assistant_conversations_user_id_idx on public.assistant_conversations(user_id);

alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.user_suppressed_topics enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.reading_events enable row level security;
alter table public.notes enable row level security;
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_enrichments enable row level security;

create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "User interests owned by user"
  on public.user_interests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Suppressed topics owned by user"
  on public.user_suppressed_topics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Collections readable by owner or public"
  on public.collections for select
  using (auth.uid() = user_id or is_public);

create policy "Collections writable by owner"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Collection items readable through collection access"
  on public.collection_items for select
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_items.collection_id
        and (c.user_id = auth.uid() or c.is_public)
    )
  );

create policy "Collection items writable by collection owner"
  on public.collection_items for all
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_items.collection_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.collections c
      where c.id = collection_items.collection_id
        and c.user_id = auth.uid()
    )
  );

create policy "Reading events owned by user"
  on public.reading_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Notes owned by user"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Assistant conversations owned by user"
  on public.assistant_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Assistant messages readable through owned conversation"
  on public.assistant_messages for select
  using (
    exists (
      select 1
      from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Assistant messages writable through owned conversation"
  on public.assistant_messages for all
  using (
    exists (
      select 1
      from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Sources readable by authenticated users"
  on public.sources for select
  using (auth.role() = 'authenticated');

create policy "Articles readable by authenticated users"
  on public.articles for select
  using (auth.role() = 'authenticated');

create policy "Article enrichments readable by authenticated users"
  on public.article_enrichments for select
  using (auth.role() = 'authenticated');

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();


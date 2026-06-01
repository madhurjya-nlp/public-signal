# Architecture

## Problem

The platform must ingest external information, enrich it with AI, personalize it per user, and let users build a durable knowledge archive. The architecture needs to support mobile apps first, then web, without coupling user experience to a single LLM provider or search backend.

## Options Considered

### Option 1: Supabase-only backend

Use Supabase Edge Functions and Postgres for most logic.

Pros:

- Fast to ship.
- Fewer services.
- Good auth and database integration.

Cons:

- AI orchestration and feed ranking logic can become hard to maintain.
- Harder to test complex business logic.
- Less control over background jobs and provider adapters.

### Option 2: NestJS backend with Supabase infrastructure

Use NestJS for application logic and Supabase for auth, Postgres, storage, and RLS.

Pros:

- Clear domain boundaries.
- Strong testability.
- Provider-neutral AI gateway fits naturally.
- Easier long-term migration to dedicated services.

Cons:

- More setup.
- Requires disciplined authorization checks across API and RLS.

### Option 3: Fully custom backend from day one

Own auth, storage, database, search, and AI infrastructure.

Pros:

- Maximum control.

Cons:

- Slower.
- More security burden.
- Premature for MVP.

## Recommendation

Use Option 2.

NestJS should own:

- Feed assembly and ranking.
- AI orchestration.
- Content ingestion.
- API authorization.
- Search and vector orchestration.
- Assistant RAG pipeline.

Supabase should own:

- Auth.
- Postgres.
- Storage.
- Realtime where useful.
- Row-level security.

Flutter should own:

- Mobile UI.
- Local cache.
- Offline-friendly reading state.
- Accessibility and responsive layout.

## High-Level System

```text
Flutter App
  |
  | HTTPS + Supabase JWT
  v
NestJS API
  |
  +-- Supabase Postgres/Auth/Storage
  +-- AI Gateway
  |     +-- OpenAI
  |     +-- Anthropic
  |     +-- Gemini
  |     +-- Local/Open Source
  +-- Vector DB: Qdrant or Pinecone
  +-- Search: Typesense or Elasticsearch
```

## Core Domains

- Users and profiles.
- Interests and suppressed topics.
- Sources and articles.
- AI enrichments.
- Feed items.
- Collections.
- Saves.
- Search.
- Assistant conversations.

## Database Considerations

- Use UUID primary keys.
- Store article metadata and canonical URL, not full copyrighted content.
- Store AI outputs with model/provider metadata for auditability.
- Use RLS for every user-owned table.
- Keep user preferences separate from derived behavioral signals.
- Record explicit saves as first-class analytics events.

## API Design

All app-facing endpoints require a valid Supabase JWT unless explicitly public.

Initial REST endpoints:

- `GET /health`
- `GET /v1/me`
- `PUT /v1/me/interests`
- `GET /v1/feed/today`
- `GET /v1/articles/:id`
- `POST /v1/collections`
- `GET /v1/collections`
- `POST /v1/collections/:id/items`
- `DELETE /v1/collections/:id/items/:articleId`
- `GET /v1/search`
- `POST /v1/assistant/messages`

## Edge Cases

- Empty feed after onboarding.
- Conflicting interests and suppressed topics.
- Duplicate articles from multiple sources.
- Broken source URLs.
- Missing thumbnails.
- AI provider timeout or refusal.
- User deletes account.
- User revokes provider permissions.
- Article removed by source.

## Scalability Concerns

- Feed generation should become async and cacheable.
- Article enrichment should run in background jobs.
- Embedding generation must be batched and rate-limited.
- Search indexes should be eventually consistent.
- Assistant context should be capped by retrieval quality and token budget.


# Personal Newspaper

Mobile-first knowledge platform for creating and consuming a personalized newspaper.

The product helps users move through three stages:

- Curator: choose interests and suppress topics.
- Collector: save articles into personal desks and collections.
- Creator: later create notes, editions, visual essays, and public newspapers.

## MVP Scope

This repository is scoped to the initial MVP:

- Authentication
- Interest selection
- Personal feed
- AI summaries
- Why It Matters
- Collections
- Save articles
- Search
- Basic AI assistant
- iOS and Android

Explicitly out of scope for MVP:

- Comments
- Social network features
- Public profiles
- Creator mode
- Community publishing
- Advertising system

## Repository Layout

```text
personal-newspaper/
  apps/
    api/                  NestJS backend
    mobile/               Flutter app shell
  packages/
    contracts/            Shared TypeScript contracts
    ai-gateway/           Provider-neutral AI interfaces
  infra/
    supabase/             Database migrations and policies
  docs/
    architecture.md
    product-mvp.md
    security.md
```

## Local Development

Prerequisites:

- Node.js 20+
- npm 10+
- Flutter 3.22+
- Supabase CLI
- Docker, for local Supabase and vector/search services

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev:api
```

Run the mobile app:

```bash
cd apps/mobile
flutter pub get
flutter run
```

## CI Checks

GitHub Actions runs on every push to `main` and every pull request targeting `main`.

- Node CI runs `npm run typecheck`, `npm --workspace @personal-newspaper/api test`, `npm run lint`, and `npm run build`.
- Flutter CI runs `flutter pub get`, `flutter analyze`, and `flutter test` in `apps/mobile`.
- Supabase local smoke tests remain manual and are not part of CI.

## Deployment Config

Production and staging backend flags, CORS requirements, and Flutter build-time
environment values are documented in `docs/RUNBOOK.md`.

Staging deployment setup for Supabase Cloud, Render, and Flutter Web is
documented in `docs/deployment-staging.md`.

## Architecture Principles

- The mobile app never talks directly to LLM providers.
- The backend owns ranking, personalization, AI orchestration, and authorization.
- Supabase owns authentication, Postgres, storage, and row-level security.
- Full article text is not stored by default. Store metadata, canonical URL, summaries, and derived embeddings.
- LLM providers are swappable through a gateway interface.
- The primary success metric is saved items per user per week.

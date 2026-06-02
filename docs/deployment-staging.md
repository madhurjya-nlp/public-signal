# Public Signal Staging Deployment

This document defines the current staging deployment target for Public Signal.

Do not create tables manually in the Supabase dashboard. Apply schema changes
through repo migrations only.

## Staging Architecture

- Database and auth: Supabase Cloud
- Backend API: Render Web Service for the NestJS app
- Frontend: Flutter Web static hosting later

Current intent:

- bring up the backend against Supabase Cloud first
- verify auth, feed, vote, save, skip, notebook, and rankings
- deploy Flutter Web after the backend is stable

## Supabase Cloud Setup

Staging project:

- project ref: `fxvgtgbdipsgduhiqxqq`
- project URL: `https://fxvgtgbdipsgduhiqxqq.supabase.co`

Migration command:

```bash
npx supabase db push --workdir infra
```

Rules:

- Do not manually create tables in the dashboard.
- Do not seed local Indian candidate data or local story-clustering smoke data
  into staging unless explicitly needed for a controlled test.
- Keep schema changes forward-only through repo migrations.

Recommended sequence:

1. Link or authenticate the Supabase CLI to the staging project.
2. Run `npx supabase db push --workdir infra`.
3. Confirm tables appear in the `public` schema.
4. Only then connect the Render backend.

## Render Backend Setup

Service type:

- Web Service

Suggested branch:

- `main` for shared staging
- or a dedicated staging branch if you want pre-merge verification

Root directory:

- repository root

Backend build command:

```bash
npm ci && npm run build
```

Backend start command:

```bash
npm --workspace @personal-newspaper/api run start
```

Required backend environment variables:

- `NODE_ENV=production`
- `CORS_ORIGIN=<FRONTEND_STAGING_URL>`
- `SUPABASE_URL=https://fxvgtgbdipsgduhiqxqq.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_STAGING_SERVICE_ROLE_KEY>`
- `RSS_POLLING_ENABLED=false`
- `MANUAL_INGESTION_ENABLED=false`
- `SEARCH_ENABLED=false`
- `ASSISTANT_ENABLED=false`

Platform note:

- `PORT` is required by the NestJS app, but Render injects it automatically.
- `SUPABASE_JWT_SECRET` is not required by the current backend runtime and
  should not be added unless the backend implementation changes.

Staging guidance:

- Keep `RSS_POLLING_ENABLED=false` on the first staging deploy.
- Keep manual ingestion disabled publicly.
- Keep placeholder search and assistant disabled.

## Flutter Web Deployment

Flutter Web static hosting is a later staging step.

Linux/macOS build command:

```bash
flutter build web --release \
  --dart-define=API_BASE_URL=<BACKEND_STAGING_URL> \
  --dart-define=SUPABASE_URL=https://fxvgtgbdipsgduhiqxqq.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<SUPABASE_STAGING_ANON_KEY>
```

Windows local equivalent:

```powershell
C:\dev\flutter\bin\flutter.bat build web --release --dart-define=API_BASE_URL=<BACKEND_STAGING_URL> --dart-define=SUPABASE_URL=https://fxvgtgbdipsgduhiqxqq.supabase.co --dart-define=SUPABASE_ANON_KEY=<SUPABASE_STAGING_ANON_KEY>
```

Build output:

- `apps/mobile/build/web`

Warning:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to Flutter.
- Flutter should receive only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
  `API_BASE_URL`.

## Supabase Auth Configuration

Set in Supabase Cloud:

- Site URL = frontend staging URL
- Redirect URLs = frontend staging URL

Decision pending:

- email confirmation policy for staging and public beta

Until that policy is decided, keep the auth behavior explicit per environment
review and test the full signup flow after every auth config change.

## First Staging Smoke Test

- [ ] `GET /v1/health` returns `200`
- [ ] frontend loads successfully
- [ ] sign up works
- [ ] interest selection persists
- [ ] feed loads
- [ ] vote works
- [ ] save works
- [ ] skip works
- [ ] profile analytics update
- [ ] saved notebook loads
- [ ] rankings load

## What Not To Enable Yet

- Indian candidate sources
- public manual ingestion
- assistant
- search
- RSS polling until backend behavior is verified
- AI or LLM claims beyond the current implementation

## Rollback Notes

- frontend rollback = redeploy previous static build
- backend rollback = redeploy previous Render release
- database rollback requires backups and forward-migration discipline

Do not assume `db push` is trivially reversible. Treat schema rollout as
forward-only unless you have an explicit backup and rollback plan.

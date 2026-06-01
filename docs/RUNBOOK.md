# Public Signal Local Runbook

This runbook describes how to run the local Public Signal MVP stack.

Repository path:

```powershell
C:\dev\personal-newspaper
```

Flutter binary:

```powershell
C:\dev\flutter\bin\flutter.bat
```

## Prerequisites

- Node.js and npm
- Docker Desktop
- Supabase CLI through `npx supabase`
- Flutter at `C:\dev\flutter\bin\flutter.bat`
- Chrome installed for Flutter web

## 1. Start Supabase

From the repo root:

```powershell
cd C:\dev\personal-newspaper
npx supabase start --workdir infra\supabase
```

Check environment output:

```powershell
npx supabase status -o env --workdir infra\supabase
```

The backend script reads this output and exports:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

## 2. Start Backend

From the repo root:

```powershell
.\scripts\start-backend-local.ps1
```

This runs:

```powershell
npm --workspace @personal-newspaper/api run start:dev
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/v1/health
```

## 3. Start Flutter Chrome

From the repo root:

```powershell
.\scripts\run-mobile-chrome.ps1
```

This runs Flutter from:

```powershell
C:\dev\flutter\bin\flutter.bat
```

with:

```powershell
--dart-define=API_BASE_URL=http://localhost:3000
```

## 4. Run MVP Checks

From the repo root:

```powershell
.\scripts\check-mvp.ps1
```

It runs:

```powershell
npm run typecheck
npm --workspace @personal-newspaper/api test
npm run lint
npm run build
C:\dev\flutter\bin\flutter.bat analyze
```

Flutter analysis is skipped if `C:\dev\flutter\bin\flutter.bat` does not exist.

## Local Story Clustering Seed Test

To verify multi-source story grouping against local Supabase, load the local
Supabase environment variables and run:

```powershell
npm run stories:seed-local
```

This local-only command inserts or reuses four fake articles from local test
sources. Three controlled Assam flood headlines should form one story group
with multiple sources. A separate robotics article should remain in another
group.

The command is idempotent: rerunning it does not duplicate article rows or
story-group links. The generated rows are fake local test data, not production
content.

## Future Saved Article Processing

Saved articles are stored as user library actions only. They do not affect
rankings and they do not trigger AI processing today.

A later editorial pipeline can use saved articles as inputs after source and
rights review:

```text
saved article -> source review -> extract text -> editorial brief -> grammar/style rewrite -> user-facing AI brief
```

That pipeline is not implemented in the current MVP.

## User Action UX V0

Public Signal keeps three user actions separate:

- Votes (`critical`, `worth_knowing`, `not_important`) drive rankings.
- Save is a private library action and does not affect rankings.
- Skip is a private no-opinion action and does not affect rankings.

Profile analytics and action detail panels are private to the authenticated
user. The Saved Notebook groups saved clippings for later reading and can
become a future input surface for editorial or AI processing after source and
rights review. No AI processing is implemented today.

## Interest-aware Rankings V0

Daily rankings remain vote-based. The scoring formula is unchanged:

- `critical = 3`
- `worth_knowing = 1`
- `not_important = -1`

The mobile app requests:

```text
GET /v1/rankings/daily?scope=my_interests&limit=10
```

`scope=my_interests` filters ranked stories to the authenticated user's
selected categories. If the user has no selected interests, rankings fall back
to the global vote-based result. Save and skip actions do not affect rankings.
`thumbnail_url` is display metadata only.

## Common Errors

### `SUPABASE_URL does not exist`

The backend was started without Supabase environment variables.

Fix:

```powershell
cd C:\dev\personal-newspaper
npx supabase start --workdir infra\supabase
.\scripts\start-backend-local.ps1
```

Do not start the backend with plain `npm run dev:api` unless your shell already
has Supabase env vars loaded.

### `Could not find the table public.profiles in the schema cache`

The local Supabase database does not have the repo migrations applied, or
PostgREST has not reloaded its schema cache.

For a disposable local development database, reset Supabase from the configured
workdir:

```powershell
cd C:\dev\personal-newspaper
npx supabase db reset --workdir infra\supabase
```

Warning: this clears local Supabase data. Restart the backend after the reset:

```powershell
.\scripts\start-backend-local.ps1
```

### `Expected 3 parts in JWT; got 1`

The API key being used as a JWT is malformed, usually because local Supabase env
was copied incorrectly or a placeholder key is being used.

Fix:

```powershell
npx supabase status -o env --workdir infra\supabase
```

Then restart the backend through:

```powershell
.\scripts\start-backend-local.ps1
```

### Path With Spaces

Use quotes around paths that contain spaces. This repo should use:

```powershell
cd C:\dev\personal-newspaper
```

For other user-directory paths, prefer:

```powershell
cd "C:\Users\Madhurjya Saikia\..."
```

### Chrome Closed

Flutter web stops when the Chrome debug session closes.

Fix:

```powershell
.\scripts\run-mobile-chrome.ps1
```

If Chrome still fails, run:

```powershell
C:\dev\flutter\bin\flutter.bat devices
```

and confirm Chrome appears.

### No Articles Available

Possible causes:

- Supabase migrations have not been applied.
- Ingestion has not run.
- The user has already voted on all available articles.
- Backend is pointing at a different Supabase instance.

Fix:

```powershell
.\scripts\start-backend-local.ps1
```

Then call the authenticated ingestion endpoint from a signed-in session or use
the app after seeded/ingested articles exist.

### Backend Not Running

Check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/v1/health
```

If it fails:

```powershell
.\scripts\start-backend-local.ps1
```

If port `3000` is already occupied, stop the old process before restarting.

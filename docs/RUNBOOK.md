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

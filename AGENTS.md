# Public Signal Agent Guide

This repository is the existing Public Signal monorepo.

Local repo path:

```powershell
C:\dev\personal-newspaper
```

Flutter binary:

```powershell
C:\dev\flutter\bin\flutter.bat
```

## Operating Rules

- Do not create a new project.
- Do not rewrite the stack.
- Do not enable disabled Indian candidate sources without explicit approval.
- Do not weaken backend UUID validation.
- Do not change ingestion behavior while doing local operations work.
- Keep the MVP scope focused on signup, interests, feed, vote, and rankings.

## Runtime Stack

- Backend: NestJS in `apps/api`
- Mobile/web: Flutter in `apps/mobile`
- Database/auth: local Supabase from `infra/supabase`
- Contracts: TypeScript package in `packages/contracts`
- AI gateway: TypeScript package in `packages/ai-gateway`

## Common Commands

Start Supabase:

```powershell
cd C:\dev\personal-newspaper
npx supabase start --workdir infra\supabase
```

Start backend:

```powershell
cd C:\dev\personal-newspaper
.\scripts\start-backend-local.ps1
```

Start Flutter Chrome:

```powershell
cd C:\dev\personal-newspaper
.\scripts\run-mobile-chrome.ps1
```

Run MVP checks:

```powershell
cd C:\dev\personal-newspaper
.\scripts\check-mvp.ps1
```


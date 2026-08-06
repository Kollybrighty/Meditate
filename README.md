# Meditate — Bible Study App

Group-based Bible study platform with reading plans, offline/audio reading, Q&A forums, and a Kids classroom section.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deploy:** Vercel (cloud) or Docker (local/self-hosted)

## Connect Supabase + Vercel

**Full step-by-step guide:** [docs/SUPABASE-VERCEL-SETUP.md](docs/SUPABASE-VERCEL-SETUP.md)

Quick summary:
1. Create a Supabase project → run `supabase/FULL_SCHEMA.sql` in SQL Editor
2. Copy API keys into `.env.local`
3. Push to GitHub → import in Vercel → add same env vars → Deploy

## Quick start — Local

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start local Supabase (requires Docker + Supabase CLI)
npm run supabase:start

# 4. Apply migrations
npm run db:migrate

# 5. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Quick start — Cloud

1. Create a [Supabase](https://supabase.com) project and run migrations from `supabase/migrations/`
2. Deploy to [Vercel](https://vercel.com) and set env vars from `.env.example`
3. Push to `main` for auto-deploy

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run dev:cloud` | Dev server using cloud Supabase |
| `npm run build` | Production build |
| `npm run docker:up` | Self-hosted Docker stack |
| `npm run supabase:start` | Start local Supabase |

## Project structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # UI components
└── lib/           # Supabase, utilities
supabase/
└── migrations/    # Database schema
```

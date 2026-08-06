# Connect Supabase + Vercel for Meditate

Follow these steps in order. Total time: ~20 minutes.

---

## Part 1 — Supabase (database + auth)

### Step 1: Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in (or create a free account)
3. Click **New project**
4. Choose:
   - **Name:** `meditate-app`
   - **Database password:** save this somewhere safe
   - **Region:** closest to your users
5. Wait ~2 minutes for the project to finish provisioning

### Step 2: Run database migrations

**Option A — Supabase Dashboard (easiest, no CLI)**

1. In your project, open **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/20250729120000_initial_schema.sql` → paste → **Run**
4. Repeat for `supabase/migrations/20250729120100_seed_characters.sql`

**Option B — Supabase CLI**

```powershell
cd C:\Users\kolaw\Projects\meditate-app
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Your **Project ref** is in: Dashboard → Project Settings → General → Reference ID

### Step 3: Copy your Supabase API keys

1. Dashboard → **Project Settings** → **API**
2. Copy these three values:

| Key | Where to use |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** (secret!) | `SUPABASE_SERVICE_ROLE_KEY` |

### Step 4: Configure auth redirect URLs

1. Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (or `http://localhost:3000` for local dev)
3. Add **Redirect URLs:**
   - `http://localhost:3000/**`
   - `https://YOUR-VERCEL-APP.vercel.app/**`
   - `https://YOUR-CUSTOM-DOMAIN.com/**` (if you add one later)

---

## Part 2 — Local development

1. Copy the env template:

```powershell
cd C:\Users\kolaw\Projects\meditate-app
copy .env.example .env.local
```

2. Edit `.env.local` and paste your Supabase keys from Step 3:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
BIBLE_API_KEY=
RESEND_API_KEY=
```

3. Start the dev server:

```powershell
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) → **Get started** → register an account

---

## Part 3 — Vercel (hosting)

### Step 1: Push code to GitHub

1. Create a repo at [https://github.com/new](https://github.com/new) named `meditate-app`
2. Push your code:

```powershell
cd C:\Users\kolaw\Projects\meditate-app
git add .
git commit -m "Initial Meditate app scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meditate-app.git
git push -u origin main
```

### Step 2: Import project in Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **Import** next to your `meditate-app` repository
4. **Framework Preset:** Next.js (auto-detected)
5. **Root Directory:** `./` (default)
6. Expand **Environment Variables** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` (update after first deploy) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `BIBLE_API_KEY` | (optional for now) |
| `RESEND_API_KEY` | (optional for now) |

7. Click **Deploy**

### Step 3: Update URLs after first deploy

1. Vercel gives you a URL like `https://meditate-app-abc123.vercel.app`
2. Update in **Vercel** → Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL
3. Update in **Supabase** → Authentication → URL Configuration:
   - Site URL = your Vercel URL
4. Redeploy: Vercel → Deployments → ... → **Redeploy**

---

## Part 4 — Verify everything works

| Test | Expected |
|---|---|
| Visit Vercel URL | Landing page loads with Meditate logo |
| Register | Creates account, redirects to dashboard |
| Create group | Group appears on dashboard with invite link + QR |
| Sign out / sign in | Session persists correctly |

---

## Troubleshooting

### "Invalid API key" or auth fails
- Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
- Redeploy after changing env vars

### Register works locally but not on Vercel
- Add your Vercel URL to Supabase **Redirect URLs** (Authentication → URL Configuration)

### Database errors (table not found)
- Run both migration SQL files in Supabase SQL Editor

### Email confirmation blocking signup
- Supabase Dashboard → Authentication → Providers → Email → disable **Confirm email** for development

---

## Quick reference

| Service | Dashboard |
|---|---|
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| Local app | http://localhost:3000 |
| Supabase Studio (local) | http://localhost:54323 (when using `npx supabase start`) |

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
RESEND_FROM_EMAIL=Meditate <onboarding@resend.dev>
NEXT_PUBLIC_CONTACT_EMAIL=
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
| `BIBLE_API_KEY` | API.Bible Starter key for in-app NLT ([scripture.api.bible](https://scripture.api.bible)). Leave empty and NLT opens on Bible Gateway. WEB and KJV stay in the app either way. |
| `RESEND_API_KEY` | From [resend.com](https://resend.com). When set, password reset and group/Kids notices send through Resend. When empty, password reset still uses Supabase Auth email. |
| `RESEND_FROM_EMAIL` | `Meditate <onboarding@resend.dev>` until your domain is verified, then `Meditate <hello@your-domain.com>`. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address shown on the privacy policy and terms. Also receives error alerts when Resend is set. |

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
| Visit `/privacy` and `/terms` | Both pages load, with your contact email if you set one |
| Register | Checkbox for Terms and Privacy is required, then the account is created |
| Create group | Group appears on dashboard with invite link + QR |
| Sign out / sign in | Session persists correctly |

---

## Troubleshooting

### "Invalid API key" or auth fails
- Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
- Redeploy after changing env vars

### "Can't reach the sign-in service" or "fetch failed"
The app cannot contact your Supabase project. Login and password reset both fail until this is fixed.
1. Open [Supabase Dashboard](https://supabase.com/dashboard) and confirm the project still exists (not paused or deleted).
2. Copy **Project Settings → API → Project URL**. It should look like `https://xxxx.supabase.co`, not `http://127.0.0.1:54321`.
3. Set that URL plus the **anon** key in `.env.local` and in **Vercel → Settings → Environment Variables**.
4. Redeploy on Vercel. Restart `npm run dev` locally.

### Register works locally but not on Vercel
- Add your Vercel URL to Supabase **Redirect URLs** (Authentication → URL Configuration)

### Database errors (table not found)
- Run both migration SQL files in Supabase SQL Editor

### Email confirmation blocking signup
- Supabase Dashboard → Authentication → Providers → Email → disable **Confirm email** for development

### Password reset email never arrives
- Without `RESEND_API_KEY`, Supabase sends the email. Check Authentication → Emails, and spam.
- With `RESEND_API_KEY`, the app sends the link itself. On the Resend free plan, `onboarding@resend.dev` can only deliver to the email on your Resend account until you verify a domain.
- The redirect URL (`https://your-domain.com/auth/callback`) must be listed in Supabase → Authentication → URL Configuration.

### NLT text does not appear inside the reader
- WEB and KJV do not need a key.
- For in-app NLT, set `BIBLE_API_KEY` and add NLT to that API.Bible app. Until then, choosing NLT opens Bible Gateway.

---

## Part 5 — Custom domain

Buy the domain at Cloudflare Registrar, Porkbun, or Namecheap. Then attach it to the Vercel project. Meditate already uses the address the visitor typed for invite links and password reset, so you do not change application code.

1. Vercel → your project → **Settings** → **Domains** → **Add** → enter `your-domain.com` and `www.your-domain.com`.
2. At the registrar, add the DNS records Vercel shows. That is usually:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` record for `www` → `cname.vercel-dns.com`
3. Wait until Vercel shows the domain as valid. HTTPS is issued for you.
4. Set `NEXT_PUBLIC_APP_URL` to `https://your-domain.com` and redeploy.
5. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL:** `https://your-domain.com`
   - **Redirect URLs:** `https://your-domain.com/**`
6. After the domain is verified in Resend, set `RESEND_FROM_EMAIL` to an address on that domain, such as `Meditate <hello@your-domain.com>`.

---

## Quick reference

| Service | Dashboard |
|---|---|
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| Local app | http://localhost:3000 |
| Supabase Studio (local) | http://localhost:54323 (when using `npx supabase start`) |

# TaxWise — Complete Deployment Guide

AI-powered tax optimization platform. Track income & expenses, get personalized IRA recommendations, and ask how any financial decision impacts your specific tax bill.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database + Auth | Supabase (Postgres + built-in auth) |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project** — name it `taxwise`, pick a region
3. Once the project is ready, go to **SQL Editor** → **New query**
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Project Settings** → **API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **API Keys** → **Create Key**
3. Copy the key → this is your `ANTHROPIC_API_KEY`

---

## Step 3 — Set up environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in every value:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
JWT_SECRET=any-random-32-char-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a JWT secret:
```bash
openssl rand -base64 32
```

---

## Step 4 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 5 — Deploy to Vercel

### Option A: GitHub (recommended)

1. Push this folder to a new GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Under **Environment Variables**, add all variables from `.env.local`
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://taxwise.vercel.app`)
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
# Follow the prompts, then add env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel --prod
```

---

## Step 6 — Configure Supabase for production

In Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: your Vercel URL (e.g. `https://taxwise.vercel.app`)
- **Redirect URLs**: add `https://taxwise.vercel.app/**`

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── login/page.tsx              ← Login
│   ├── register/page.tsx           ← Register
│   ├── (app)/                      ← Protected app routes
│   │   ├── layout.tsx              ← Sidebar shell
│   │   ├── dashboard/page.tsx
│   │   ├── tracker/page.tsx
│   │   ├── ira/page.tsx
│   │   ├── advisor/page.tsx
│   │   └── profile/page.tsx
│   └── api/
│       ├── chat/route.ts           ← Anthropic proxy (secure)
│       ├── chat/clear/route.ts
│       ├── transactions/route.ts   ← CRUD
│       └── profile/route.ts        ← Profile update
├── components/
│   ├── layout/AppShell.tsx         ← Sidebar navigation
│   ├── dashboard/DashboardClient.tsx
│   ├── tracker/TrackerClient.tsx
│   ├── ira/IRAClient.tsx
│   ├── advisor/AdvisorClient.tsx
│   └── profile/ProfileClient.tsx
├── lib/
│   ├── tax.ts                      ← Tax engine (2025 rules)
│   └── supabase/
│       ├── client.ts               ← Browser client
│       └── server.ts               ← Server client
└── middleware.ts                   ← Auth protection
```

---

## Features

- **User accounts** — Supabase Auth with email/password. Full signup, login, session persistence
- **Row-level security** — Users can only see their own data (enforced in Postgres, not just app code)
- **Finance tracker** — Log income and expenses with category tagging. Deductible expenses auto-flagged
- **Live tax estimates** — Real-time 2025 federal tax calculation as you update your profile
- **IRA analysis** — Roth vs Traditional recommendation engine with retirement projections and income slider
- **AI tax advisor** — Claude-powered chatbot with your complete financial context. Calculates exact before/after dollar impact of any financial scenario. API key stays server-side
- **Auto-saving** — Profile and transactions persist immediately via API routes

---

## Environment Variables Reference

| Variable | Where to get it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | ✓ |
| `ANTHROPIC_API_KEY` | console.anthropic.com | ✓ |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | ✓ |
| `NEXT_PUBLIC_APP_URL` | Your domain or `http://localhost:3000` | ✓ |

---

## Disclaimer

TaxWise is for informational purposes only. It is not a licensed tax advisory service. Always consult a licensed CPA or tax professional for advice specific to your situation.

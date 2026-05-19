# BidPH

Philippine real-time auction platform with a closed-loop wallet (Idle / Bidding funds), Supabase backend, and PayMongo payments.

Built from [docs/spec-v1.md](./docs/spec-v1.md) and [docs/spec-v1-plan.md](./docs/spec-v1-plan.md).

## Stack

- **Frontend:** TanStack Start, TanStack Router, TanStack Query, Tailwind CSS, TypeScript
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime, RPC)
- **Payments:** PayMongo (webhook + local dev simulate)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
# macOS
brew install supabase/tap/supabase
```

## Local setup

### 1. Start Supabase

```bash
cd /path/to/bidph
supabase start
```

Copy the **API URL**, **anon key**, and **service_role key** from the output (or `supabase status`).

### 2. Configure environment

```bash
cp .env.example web/.env.local
```

Edit `web/.env.local` with keys from `supabase status`.

### 3. Apply migrations

Migrations run automatically on `supabase start`. To reset:

```bash
pnpm db:reset
```

### 4. Seed data (optional)

`seed.sql` inserts **demo auctions only** — no users, wallets, or bids. Listings are owned by the first `seller` / `admin` in the database.

On a fresh `pnpm db:reset` there are no users yet, so the seed skips. After you register and have a seller account:

```bash
pnpm db:seed-items
```

**Create an admin** (local dev):

Set in `web/.env.local` (then restart `pnpm dev` and sign in with that email):

```bash
VITE_DEV_ADMIN_EMAIL=you@example.com
```

Route guards treat that email as admin; on login the app also calls `claim_dev_admin` so Supabase RLS/RPCs work.

Or promote manually in SQL:

```sql
UPDATE public.users SET role = 'admin', kyc_status = 'approved' WHERE email = 'you@example.com';
```

Or use the full script: `supabase/scripts/create-admin.sql` (edit email/password first).

**Why no users in seed?** Predictable test accounts (`password123`, fixed emails) are easy to abuse if seed ever runs outside local dev. Create your own accounts via `/register`; use SQL only for admin promotion.

### 5. Install & run the web app

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Typical local flow

**With seed data**:

1. Register, complete profile/KYC, get **seller** role (admin approves KYC).
2. Run `pnpm db:seed-items` for demo auctions.
3. Promote your account to **admin** (SQL above) to use `/admin`.

**Without seed** (manual setup):

1. **Register** at `/register` (creates `users` + `wallet` via trigger).
2. **Profile** at `/account/profile` — fill legal name, address, DOB, GCash.
3. **KYC** at `/account/kyc` — upload ID + selfie.
4. **Promote admin** in Supabase Studio SQL: `UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';`
5. **Approve KYC** at `/admin/kyc`.
6. **Cash in** at `/wallet/cash-in` — use **Simulate cash-in** in dev.
7. **Allocate** Idle → Bidding on `/wallet`.
8. **Create auction** at `/sell/new` → edit → **Publish**.
9. **Bid** on `/auctions/:id`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web app (port 3000) |
| `pnpm build` | Production build |
| `pnpm db:start` | Start local Supabase |
| `pnpm db:reset` | Reset DB, re-run migrations, run seed (items if seller exists) |
| `pnpm db:seed-items` | Insert demo auctions (requires a seller account) |

## Project layout

```
bidph/
├── web/                 # TanStack Start app
├── supabase/
│   ├── migrations/      # Schema, RPCs, RLS
│   ├── seed.sql         # Local dev mock data
│   └── config.toml
└── docs/                # Spec & implementation plan
```

## PayMongo webhook

`POST /api/webhooks/paymongo` expects PayMongo checkout metadata with `user_id`. Requires `SUPABASE_SERVICE_ROLE_KEY` in `web/.env.local`.

For local testing without PayMongo, use **Simulate cash-in** on the cash-in page (`dev_simulate_cash_in` RPC).

## Production notes

- Do **not** run `seed.sql` on production (`supabase db reset` with seed is local-only). Remote deploys should use migrations only (`db push`).
- Never commit or automate admin credentials; promote admins manually per environment.
- Disable or remove `dev_simulate_cash_in` before production.
- Configure Supabase Auth OAuth (Google/Facebook) in the dashboard.
- Set `PAYMONGO_WEBHOOK_SECRET` and verify signatures in the webhook handler.
- Use `pg_cron` or a scheduled job for `end_expired_auctions()`.

# BidPH (web)

Philippine real-time auction platform with a closed-loop wallet (Idle / Bidding funds), Supabase client (Auth, Realtime, RLS reads), and PayMongo payments (via API).

Built from [spec-v1.md](../docs/spec-v1.md) and [spec-v1-plan.md](../docs/spec-v1-plan.md).

**Database & migrations** live in [`../bidph-api`](../bidph-api) — start Supabase from that repo, then configure this app.

## Stack

- **Frontend:** TanStack Start, TanStack Router, TanStack Query, Tailwind CSS, TypeScript
- **Backend (client):** Supabase Auth, Realtime, Storage, RLS-backed queries
- **Backend (server):** [`bidph-api`](../bidph-api) — Postgres migrations, Hono API (planned)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- Docker + [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB — run from **bidph-api**)

## Local setup

### 1. Start Supabase (**bidph-api**)

```bash
cd ../bidph-api
pnpm db:start
pnpm db:env       # copy API URL, PUBLISHABLE_KEY, SECRET_KEY
```

### 2. Configure the web app

```bash
cd ../bidph
cp .env.example web/.env.local
```

Edit `web/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `bidph-api` `pnpm db:env`.

### 3. Reset / seed (optional, in **bidph-api**)

```bash
cd ../bidph-api
pnpm db:reset           # migrations + seed hook
pnpm db:seed-items      # demo auctions after you register a user in the web app
```

Admin SQL: `bidph-api/supabase/scripts/create-admin.sql`.

**Dev admin:** set `VITE_DEV_ADMIN_EMAIL` in `web/.env.local`, restart `pnpm dev`, sign in — see [bidph-api README](../bidph-api/README.md).

### 4. Run the web app

```bash
cd ../bidph
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Typical local flow

1. Start Supabase in **bidph-api**, configure **bidph** `web/.env.local`.
2. Register at `/register`, complete profile/KYC.
3. `pnpm db:seed-items` in **bidph-api** for demo auctions (needs a seller/admin user).
4. Promote admin via SQL or `VITE_DEV_ADMIN_EMAIL`.
5. Cash in → allocate → sell → bid.

## Scripts (this repo)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web on port 3000 |
| `pnpm build` | Production build |
| `pnpm check` | lint + typecheck + test |

Database scripts (`db:start`, `db:reset`, …) are in **bidph-api**.

## Project layout

```
bidph/
└── web/                 # TanStack Start app
```

```
bidph-api/               # sibling repo
└── supabase/            # migrations, seed, config.toml
```

Specs: [`../docs/`](../docs/) — [spec-v1-plan2.md](../docs/spec-v1-plan2.md).

## PayMongo

Webhooks and service role belong in **bidph-api**, not here. For local cash-in without PayMongo, use **Simulate cash-in** on `/wallet/cash-in`.

## Production notes

- Schema: `pnpm db:push` from **bidph-api** only.
- Web env: publishable key + public Supabase URL only; no secret key.
- Disable `dev_simulate_cash_in` before production.

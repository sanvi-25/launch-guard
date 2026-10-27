# LaunchGuard

Aerospace supply-chain delay risk engine. Launch Library 2 schedules are cross-matched against Spaceflight News (SNAPI) for delay language, scored HIGH / MEDIUM / NORMAL, and audits are saved to Neon Postgres. NASA APOD is the hero backdrop.

## Setup
1. `npm install`
2. Create a Neon project, copy the connection string.
3. `cp .env.example .env.local` and fill in `DATABASE_URL` (and optionally `NASA_API_KEY`).
4. `DATABASE_URL=... npm run db:init` (or paste `schema.sql` in the Neon SQL editor).
5. `npm run dev` → http://localhost:3000

## Deploy
Push to GitHub, import into Vercel, add `DATABASE_URL` and `NASA_API_KEY` env vars.

## Data flow
Launch schedule → keyword match on agency/rocket in news → risk score → "Log risk audit" server action → `risk_audits` table → history panel.

Note: Launch Library's dev endpoint is rate limited; results are cached 5 min.

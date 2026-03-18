# API

Backend API for Vencura Wallet — custodial wallet operations (create, balance, sign, send). Type-safe REST API built with Fastify & OpenAPI. Routes in `src/routes/` are the source of truth; OpenAPI spec is generated from them. Clients generated via Hey API in `@repo/core`.

## Development

Start database first (`pnpm db:start`), then `pnpm dev`. Uses Supabase CLI for PostgreSQL, or `PGLITE=true` for in-memory. Dev server at [http://localhost:3000](http://localhost:3000).

**Switching project_id:** If you change `project_id` in `supabase/config.toml` (e.g. after a rebrand), run `pnpm db:stop` before `pnpm db:start`—only one Supabase instance runs per host.

## Vercel

Uses `framework: "fastify"` in vercel.json. Vercel auto-detects `server.ts` as the entrypoint. PostgreSQL migrations run at build time; PGLite migrations run at runtime.

**OPTIONS Allowlist (CORS preflight):** When Deployment Protection is enabled on preview deployments, add `/` (or `/auth`) to **Project Settings > Deployment Protection > OPTIONS Allowlist**. Otherwise, preflight OPTIONS requests are blocked before reaching Fastify and CORS fails for cross-origin clients.

**CI & Builds** (`api-e2e.yml`): Unit tests and E2E run on PR when `apps/api` or its dependencies change. Spawns API locally via `test:e2e:local`; no Vercel deploy required.

## Testing

Copy `.env.test.example` to `.env.test` (gitignored) for unit tests. Vitest loads it when present. `ALLOWED_ORIGINS` (default `*`) controls CORS and URL validation for auth callbacks.

**Auth in integration tests:** Wallet route tests use API key auth via `getOrCreateSession`. Dynamic JWT auth is exercised in E2E (web wallets spec with Dynamic sandbox).

## pnpm commands

- `pnpm dev` — Dev server with hot reload (requires db)
- `pnpm build` — Migrations + TypeScript build
- `pnpm start` — Production server
- `pnpm test` — Unit tests (Vitest)
- `pnpm test:e2e` — E2E (expects API URL via env or `--api`)
- `pnpm test:e2e:local` — Spawn API, poll, run E2E, cleanup
- `pnpm test:e2e:ui` — E2E with Playwright UI
- `pnpm test:e2e:debug` — Debug E2E tests
- `pnpm checktypes` — Type-check
- `pnpm db:start` — Start Supabase (local)
- `pnpm db:stop` — Stop Supabase (run before switching to another project’s Supabase)
- `pnpm db:reset` — Reset Supabase database (drops and recreates; no Supabase seed.sql)
- `pnpm db:reset-and-migrate` — Reset DB, then run Drizzle migrations. Seeding via Drizzle (no Supabase seed.sql)
- `pnpm db:migrate` — Run migrations (skips when PGLITE=true; use `RUN_PG_MIGRATE=true` to force PostgreSQL)
- `pnpm db:generate` — Generate migrations from schema
- `pnpm db:push` — Push schema (dev only)
- `pnpm generate:openapi` — Regenerate OpenAPI spec

## Deferred / Optional

- **Successful send with real chain** — Use [Anvil](https://book.getfoundry.sh/anvil) or manual verification to test wallet send against a funded Sepolia address. Document flow in README if needed.

## Custodial Wallets (Security)

The `/wallets` API manages custodial wallets for authenticated users. Security measures:

- **Private keys encrypted at rest** — AES-256-GCM via `ENCRYPTION_KEY`; never logged or exposed
- **Address validation** — viem `getAddress(to)` rejects invalid addresses with 400
- **Rate limiting** — Wallet creation and send endpoints use `@fastify/rate-limit`
- **Auth** — All wallet routes require Bearer (Dynamic JWT or API key) and enforce ownership

## Links

- [Environment setup](https://vencura-docs.vercel.app/docs/development) — Env vars, `DATABASE_URL`, `PGLITE`
- [Deployment](https://vencura-docs.vercel.app/docs/deployment) — Vercel, Cloud Run, ECS
- [Authentication](https://vencura-docs.vercel.app/docs/architecture/authentication) — JWT, magic link, API keys
- [API architecture](https://vencura-docs.vercel.app/docs/architecture/api) — Routes, OpenAPI, clients
- [Database migrations](https://vencura-docs.vercel.app/docs/adrs/008-database) — PostgreSQL vs PGLite

# Vencura Wallet

The Venmo of wallets — custodial wallets for Web3. An API platform to generate custodial wallets on the backend with backend-only operations (getBalance, signMessage, sendTransaction). Dynamic auth, typed SDKs, and a portable architecture.
Fastify • OpenAPI • Next.js • Expo — one stack, multiple platforms.

> 🚧 **Active development** — Explore, fork, and contribute. 🏗️

## Features

- 🔐 **Custodial wallet API** — `getBalance()`, `signMessage()`, `sendTransaction()` — all wallet operations via backend API
- 🔑 **Dynamic auth** — Magic link, OAuth, Web3 sign-in, and API keys for programmatic access
- 🔒 **Encrypted keys at rest** — AES-256-GCM for private keys; never logged or exposed
- 📦 **SDK generation** — Type-safe clients from OpenAPI via HeyAPI for web, mobile, and CLI
- 🤖 **AI-first dev workflow** — Agent rules, skills, MCP integrations, and automated CodeRabbit reviews
- 🔌 **REST API & JWT** — OpenAPI spec, Swagger UI, JWT and API key auth for all clients
- 🔓 **Zero vendor lock-in** — Run on VPS, AWS, Vercel, or local
- 🎨 **Turbo monorepo + design system** — ShadcnUI components with shared utilities
- ⚙️ **Preconfigured dev tools** — Biome, Git workflows, hooks, and security checks
- 🛡️ **Security & quality** — Automated checks in CI (e.g. Gitleaks, OSV)
- ⛓️ **Multichain** — EVM, Solana; shared validation and chain-specific tooling
- 📐 **Conventions** — Cursor rules per domain, @repo/error, Pino logging, shared TS and style
- 🧑‍💻 **TypeScript-first** — End-to-end types from database to frontend

## Technology stack

- **AI:** AI SDK, OpenAI, Claude, Grok
- **Frontend:** Next.js 16, React 19, Tailwind, ShadcnUI
- **Backend:** Fastify, PostgreSQL, Supabase
- **Web3:** Solidity, Viem, Wagmi, Ponder, Solana
- **DevOps:** pnpm, TurboRepo, TypeScript, Biome, ESLint

## Apps

- **[API](apps/api/README.md)** — Backend API for Vencura Wallet — custodial wallet operations (balance, sign, send), Fastify & OpenAPI
- **[Web App](apps/web/README.md)** — Next.js dashboard and wallets UI for Vencura Wallet
- **[Mobile App](apps/mobile/README.md)** — Expo app for Vencura Wallet (Android, iOS, Web)
- **[Documentation](apps/docu/README.md)** — Documentation site for Vencura Wallet — architecture, ADRs, development workflows

## Packages

- **[@repo/core](packages/core/README.md)** — Runtime-agnostic API client and types generated from OpenAPI specs
- **[@repo/cli](packages/cli/README.md)** — TypeScript CLI for API (API key auth; ideal for agentic integrations)
- **[@repo/react](packages/react/README.md)** — React Query hooks for `@repo/core` API functions
- **[@repo/ui](packages/ui/README.md)** — Shared UI component library (Shadcn/ui, Tailwind)
- **[@repo/utils](packages/utils/README.md)** — Shared utilities (async, data, debug, error, logger, web3)
- **[@repo/error](packages/error/README.md)** — Error reporting and utilities (`captureError`, `getErrorMessage`)
- **[@repo/email](packages/email/README.md)** — Email template library built with React Email
- **[@repo/notif](packages/notif/README.md)** — Notification service (email, activity) with type-safe schemas


## Scripts

Run with `pnpm <script>`.

**Setup**
  - `setup` — Full setup (install, hooks, gitleaks, osv, database)
  - `setup:gitleaks`, `setup:osv` — Install Gitleaks, OSV scanner
  - `setup:database` — Database tools
**Primary**
  - `build` — Build packages and apps
  - `dev` — Start dev (core, react, error, utils, api, web)
  - `qa` — Full check: install → checktypes → lint → build → test (unit) → test:e2e (Fastify + Next, local spawn)
**Format / Lint**
  - `checktypes` — Type-check all packages
  - `format` — Format code (Biome)
  - `lint` — Lint with Biome + ESLint
  - `lint:biome`, `lint:biome:fix` — Biome check, fix
  - `lint:eslint`, `lint:eslint:fix` — ESLint check, fix
  - `lint:fix` — Fix both linters
**Test**
  - `test` — Run unit tests (packages + apps)
  - `test:e2e` — E2E (Fastify + Next)
**CI**
  - Lint and security run on every PR. App E2E (`web-e2e`, `api-e2e`) and package tests (`packages-test`) run only when relevant code changes. Mobile: EAS build, preview on main, PR OTA—see [GitHub Actions](https://vencura-docs.vercel.app/docs/deployment/github-actions) and [Mobile CI/CD](https://vencura-docs.vercel.app/docs/deployment/mobile-cicd).
**Security**
  - `security:block-files` — Block sensitive file patterns
  - `security:secrets` — Scan staged files for secrets
  - `security:secrets:full` — Full Gitleaks scan
  - `security:osv` — OSV vulnerability scan
  - `security:audit` — pnpm audit (high+)
  - `security:check` — Run security check script
**Hooks**
  - `hooks:pre-commit` — Pre-commit: security + Biome staged
  - `hooks:security` — Block files, scan secrets, OSV
**Misc**
  - `update-deps` — Update pnpm and all dependencies


## Documentation

Full docs: [vencura-docs.vercel.app](https://vencura-docs.vercel.app/docs)

- [Dev Environments](https://vencura-docs.vercel.app/docs/development/dev-environments) — Local vs remote (ports 3000, 3001, 8081; `start:localhost`, `start:tunnel`)


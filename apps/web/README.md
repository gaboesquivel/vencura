# Web App

Next.js dashboard and wallets UI for Vencura Wallet. Integrates with the custodial wallet API and Dynamic auth.

## Tech Stack

- **Next.js** 16.0.3 - React framework with App Router
- **React** 19.2.3 - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Shadcn/ui** - Component library (via `@repo/ui`)
- **next-themes** - Theme provider for dark mode
- **nuqs** - URL state management

## Monorepo Integration

This app uses shared packages from this monorepo:

- **`@repo/ui`** - Shared UI components and design system
- **`@repo/core`** - API client and types (for future API integration)
- **`@repo/react`** - React Query hooks (for future API integration)

See the [monorepo documentation](@apps/docu/content/docs/architecture/monorepo.mdx) for details on package architecture.

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **pnpm** 10.28.0

### Installation

```bash
# From monorepo root
pnpm install
```

### Running the Application

**Recommended: From monorepo root** (runs all apps with watch mode):

```bash
# From monorepo root
pnpm dev
```

This starts all development servers including:
- Fastify API server (with OpenAPI generation)
- Next.js frontend (this app)
- Package watchers for automatic rebuilds

**Alternative: Run directly** (requires building dependencies first):

```bash
# Build required packages first
pnpm build --filter=@repo/core --filter=@repo/react --filter=@repo/error --filter=@repo/utils

# Then run from this directory
cd apps/web
pnpm dev
```

**Note**: When running directly, you must rebuild dependencies (`@repo/core`, `@repo/react`, `@repo/error`, `@repo/utils`) whenever they change. Using `pnpm dev` from the root handles this automatically with watch mode.

The application will be available at `http://localhost:3000` (or the next available port).

### Building

```bash
# Build all packages and apps
pnpm build

# Or build just this app
cd apps/web
pnpm build
```

## Development

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - No-op (E2E only; apps/web has no unit tests)
- `pnpm test:e2e` - Run E2E tests (Playwright; expects URLs via env or `--app`/`--api` params)
- `pnpm test:e2e:local` - Build, spawn servers, run E2E, cleanup (recommended for local/CI)
- `pnpm start:e2e:servers` - Start Fastify + Next for manual E2E; run `pnpm test:e2e` in another terminal (run `pnpm build:e2e` first)
- `pnpm test:e2e:ui` - Run E2E with Playwright UI
- `pnpm test:e2e:debug` - Debug E2E tests

See [E2E Testing](@apps/docu/content/docs/testing/e2e-testing.mdx) for full details.

### Environment Variables

Optional environment variables — see `.env.local.example` (copy to `.env.local`) and `lib/env.ts` for the validated schema:

## Project Structure

```
apps/web/
├── app/                    # Next.js app directory
│   ├── api/auth/          # sync-token (Dynamic JWT → cookie)
│   ├── auth/              # Login (Dynamic), callback fallback, logout
│   └── ...
├── app/providers.tsx      # QueryClient, ApiProvider, createClient (Dynamic auth)
├── lib/auth/              # auth-server, auth-utils, parse-auth-cookie
├── lib/env.ts             # Environment validation (AUTH_COOKIE_NAME)
└── proxy.ts               # Middleware: auth check via verifyDynamicJwt
```

## Providers

The app uses the following providers:

- **QueryClientProvider** - TanStack Query for data fetching and caching
- **ApiProvider** - API client context from `@repo/react` with auth token injection
- **NuqsAdapter** - URL state management for query parameters
- **NextThemesProvider** - Theme management (light/dark mode)

See `components/providers.tsx` for the provider setup.

## Authentication

Authentication uses Dynamic SDK. On login success, the client calls `POST /api/auth/sync-token` with the Dynamic JWT to set the `api.session` cookie (configurable via `AUTH_COOKIE_NAME`). The cookie is **web-only**—for Next.js middleware (proxy) and server components (`getUserInfo`, `getAuthStatus`); the API client uses `getAuthToken` from Dynamic SDK directly. The proxy verifies the token via `verifyDynamicJwt` before allowing protected routes.

See [Authentication Architecture](@apps/docu/content/docs/architecture/authentication.mdx) for complete details.

## Testing

This app uses **Playwright E2E tests only** (`e2e/**/*.spec.ts`). No unit or component test suites.

**E2E Test Setup:**

E2E tests automatically start both servers:
- Fastify API server on port 3001 (dev mode locally, start mode in CI)
- Next.js frontend on port 3000

Tests wait for both servers to be ready before running. All E2E tests use real infrastructure - no mocks.

**E2E Auth (Dynamic sandbox):**

E2E tests use real Dynamic sandbox authentication. Set these in `.env.local` (never commit):

- `E2E_TEST_EMAIL` — Use `+dynamic_test` before `@` (e.g. `test+dynamic_test@yourdomain.com`)
- `E2E_STATIC_OTP` — Static OTP from [Dynamic Dashboard Test Accounts](https://app.dynamic.xyz/dashboard/developer/test-accounts)
- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` — Sandbox environment ID

**Paused:** Dynamic-auth flows are skipped in Playwright (`setup.skip` / `test.describe.skip` in `e2e/`). To re-enable full E2E, remove those skips and set the env vars above.

See [Frontend Testing Documentation](@apps/docu/content/docs/testing/frontend-testing.mdx) for complete testing patterns and examples.

## Vercel Deployment

This app includes a `vercel.json` configuration file. If deploying to Vercel:

1. **Root Directory**: Set the root directory to `apps/web` in Vercel project settings
2. **Build Command**: Should be `cd ../.. && pnpm build --filter=@repo/web` (configured in `vercel.json`)
3. **Install Command**: Should be `cd ../.. && pnpm install` (configured in `vercel.json`)

**Important**: If you see build errors about a package named "mathler" or any other incorrect filter, check your Vercel project settings and ensure they match the `vercel.json` configuration. Vercel project settings override `vercel.json`, so make sure they're aligned.

## CI & Builds

- **E2E tests** (`web-e2e.yml`) — Run on PR when `apps/web` or its dependencies change. Spawns Fastify + Next locally via `test:e2e:local`
- **Package tests** (`packages-test.yml`) — Run on PR when `packages` or `tools` change

## Related Documentation

- [Monorepo Structure](@apps/docu/content/docs/architecture/monorepo.mdx) - Package organization
- [Frontend Stack](@apps/docu/content/docs/architecture/frontend-stack.mdx) - Next.js and Shadcn/ui
- [Package Conventions](@apps/docu/content/docs/architecture/package-conventions.mdx) - Package architecture

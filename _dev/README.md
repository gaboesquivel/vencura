# Development Tools & Reference (`_dev/`)

**Internal development tooling and reference materials** - This directory contains infrastructure scripts, app templates, generators, and other internal development tools. **Nothing in `_dev/` is deployed** - this is for development reference only.

## Purpose

This directory serves as the **internal dev tools tier** in our 4-tier workspace model. It contains:

- **Infrastructure scripts** - Pulumi infrastructure-as-code for Google Cloud Platform (reference only)
- **App templates** - Starter templates for Next.js and Elysia applications
- **Test harnesses** - Development and testing utilities
- **Generators** - Code generation tools and scripts
- **Local tools** - Internal development utilities

## 4-Tier Workspace Model

This monorepo follows a **4-tier workspace model**:

| Folder | Role |
|--------|------|
| `apps/*` | User-facing products (Next.js, APIs, CLIs, etc) |
| `packages/*` | Shared libraries (types, UI, SDKs, db, contracts) |
| `config/*` | Tooling as code (eslint, tsconfig, biome, tailwind, jest, etc) |
| `_dev/**` | Internal dev tools (infra scripts, fixtures, test harnesses, generators, local tools) |

## Contents

### Infrastructure (`_dev/infra/`)

**Status**: ⚠️ **Reference only** - Kept for future reference but not actively used in this demo.

Contains Pulumi TypeScript infrastructure-as-code for deploying the Vencura API to Google Cloud Platform (Cloud Run, Cloud SQL, VPC, Secret Manager, etc.). 

**Current Deployment**: All systems are deployed on **Vercel** for this demo. The GCP infrastructure code is preserved as a reference implementation for potential future use when production security requirements demand enhanced control, security, and extensibility.

See [`_dev/infra/README.md`](./infra/README.md) for detailed documentation.

### App Templates

#### Elysia Template (`_dev/elysia/`)

A minimal Elysia application template that demonstrates basic patterns and can be used as a starting point for new Elysia-based services. This template mirrors the patterns and architecture used in the production Vencura API (`apps/api`).

**Purpose**: Starter template for creating new Elysia services following established patterns (contract-first design, Zod validation, black-box testing, environment variable management).

See [`_dev/elysia/README.md`](./elysia/README.md) for details.

#### Next.js Template (`_dev/next/`)

A Next.js application template demonstrating patterns for building Next.js apps in this monorepo. Includes examples of:

- Dynamic SDK integration
- Shared component usage (`@vencura/ui`)
- Environment variable management
- Testing setup (Vitest + Playwright)
- Mobile-first responsive design

**Purpose**: Starter template for creating new Next.js applications following established patterns.

See [`_dev/next/README.md`](./next/README.md) for details.

## Development Context

This structure is intentionally designed to showcase good monorepo practices for the **Dynamic.xyz fullstack position demo**. The separation of concerns across the 4 tiers demonstrates:

- **Clear boundaries** between user-facing apps, shared libraries, configuration, and internal tooling
- **Reusability** through shared packages and configs
- **Scalability** through template-based app generation
- **Infrastructure flexibility** with reference implementations for multiple deployment options

## Tooling

All development tools in this directory follow the monorepo standards:

- **Package Manager**: Bun (see [ADR 005: Package Manager](../apps/docs/content/docs/adrs/005-package-manager/index.mdx))
- **Linting & Formatting**: Biome + ESLint (see [ADR 006: Linters](../apps/docs/content/docs/adrs/006-linters/index.mdx))
- **Formatting**: Use root-level `bun run format` (Biome) for consistent formatting across the monorepo
- **TypeScript**: Shared configuration via `@workspace/typescript-config`

## Related Documentation

- [Root README](../README.md) - Monorepo overview and getting started
- [Architecture Guide](../apps/docs/content/docs/architecture/index.mdx) - High-level architecture documentation
- [Tooling Guide](../apps/docs/content/docs/tooling/index.mdx) - Development tools and stack
- [Google Cloud Deployment Option](../apps/docs/content/docs/google-cloud/index.mdx) - GCP deployment documentation

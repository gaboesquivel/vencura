# Documentation

Documentation site for Vencura Wallet — architecture, ADRs, development workflows, and product guides.

## Overview

Central documentation hub built with **Fumadocs** (Next.js + MDX) for Vencura Wallet. Covers product overview, custodial wallet API, security model, architecture decisions, development guides, and deployment.

## Development

```bash
pnpm dev
```

Starts docs site at [http://localhost:3002](http://localhost:3002).

## Scripts

- `pnpm dev` - Development server
- `pnpm build` - Production build
- `pnpm start` - Production server
- `pnpm checktypes` - Type check MDX and TypeScript

## Content

Documentation content in `content/docs/`:

- `product/` - Vencura Wallet product overview, custodial wallet API, security model
- `adrs/` - Architecture Decision Records documenting key technical decisions
- `architecture/` - Package architecture, patterns, and technology choices
- `development/` - Quick start, setup, tooling, and AI-assisted development
- `deployment/` - Deployment options, GitHub Actions, publishing, Vercel
- `testing/` - Testing patterns and frontend testing

## Documentation

Live site: [https://vencura-docs.vercel.app/docs](https://vencura-docs.vercel.app/docs)

### Key Guides

- **[Custodial Wallet API](https://vencura-docs.vercel.app/docs/product/wallets)** - Create, balance, sign, send
- **[Security Baseline](https://vencura-docs.vercel.app/docs/architecture/security)** - Secret scanning, vulnerability management
- **[Deployment Guide](@apps/docu/content/docs/deployment/index.mdx)** - Deployment options and strategies for all applications
- **[Publishing Guide](@apps/docu/content/docs/deployment/publishing.mdx)** - Publishing packages to npm using dual-mode exports
- **[Environment Setup](@apps/docu/content/docs/development/index.mdx)** - Configuring environment variables

### Architecture

- **[Architecture Overview](@apps/docu/content/docs/architecture/index.mdx)** - System architecture and design patterns
- **[API Development](@apps/docu/content/docs/architecture/api.mdx)** - Backend stack, Fastify, OpenAPI, Hey API
- **[Frontend Stack](@apps/docu/content/docs/architecture/frontend-stack.mdx)** - Next.js, React, and UI components
- **[Portability Strategy](@apps/docu/content/docs/architecture/portability.mdx)** - Zero vendor lock-in architecture

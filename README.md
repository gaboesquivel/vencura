# Dynamic Take Home Assignment

Full-stack monorepo project for Dynamic.xyz take-home assignment featuring custodial wallet API and Mathler game.

## Structure

```
dynamic/
├── apps/
│   ├── vencura/          # NestJS backend API (custodial wallet platform)
│   ├── vecura-ui/        # Next.js frontend for Vencura API
│   └── mathler/          # Next.js Mathler game (Wordle with numbers)
└── packages/
    ├── ui/               # Shared Shadcn/ui component library
    ├── eslint-config/    # Shared ESLint configuration
    └── typescript-config/ # Shared TypeScript configuration
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS, Radix UI
- **Authentication**: Dynamic SDK
- **Linting**: ESLint + Prettier
- **Vencura Deployment**: Google Cloud Run (Docker) + Cloudflare
- **Frontend Deployment**: Vercel

## Projects

- **[Vencura API](./apps/vencura/README.md)** - NestJS backend for custodial wallet management
- **[Vecura UI](./apps/vecura-ui/README.md)** - Next.js frontend for Vencura API
- **[Mathler](./apps/mathler/README.md)** - Next.js Mathler game with Dynamic SDK
- **[UI Package](./packages/ui/README.md)** - Shared Shadcn/ui component library

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Lint all packages
pnpm lint
```

## Architecture Decisions

See [ADRs](./.adrs/) for detailed architecture decision records:

- [001: Monorepo vs Standalone](./.adrs/001-monorepo-vs-standalone.md)
- [002: Vencura API Framework](./.adrs/002-vencura-api-framework.md)
- [003: Frontend Apps Framework](./.adrs/003-frontend-apps-framework.md)
- [004: Design System](./.adrs/004-design-system.md)
- [005: Package Manager](./.adrs/005-package-manager.md)
- [006: Linters](./.adrs/006-linters.md)
- [007: Vencura API Infrastructure](./.adrs/007-vencura-api-infrastructure.md)

## Todo

### Vencura API (Backend)

- [ ] Integrate Dynamic SDK for authentication
- [ ] Implement wallet creation endpoint
- [ ] Implement `getBalance()` endpoint
- [ ] Implement `signMessage()` endpoint
- [ ] Implement `sendTransaction()` endpoint
- [ ] Add security considerations and documentation
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add API documentation

### Vecura UI (Frontend)

- [ ] Integrate Dynamic SDK for authentication
- [ ] Build wallet creation UI
- [ ] Build balance display component
- [ ] Build message signing interface
- [ ] Build transaction sending interface
- [ ] Add error handling and loading states
- [ ] Implement responsive design

### Mathler (Frontend)

- [ ] Integrate Dynamic SDK for authentication
- [ ] Implement game logic with order of operations
- [ ] Implement color-coded feedback (green/yellow/grey)
- [ ] Store user history in Dynamic metadata
- [ ] Implement daily puzzle system
- [ ] Add crypto-related feature (NFT minting, token rewards, etc.)
- [ ] Add keyboard and mouse controls
- [ ] Polish UI/UX design

### Shared

- [ ] Document security considerations
- [ ] Add deployment configuration (Cloud Run + Cloudflare)
- [ ] Review architecture documentation

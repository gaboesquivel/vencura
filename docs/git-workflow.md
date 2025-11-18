# Git Workflow & Branching Strategy

This document describes the git branching strategy and how it maps to deployment environments and blockchain networks.

> 📘 **See also**: [Deployment and Branching Strategy](./deployment-and-branching-strategy.md) for comprehensive documentation on deployment targets (Vercel, Google Cloud), hybrid options, and CI/CD integration.

## Branching Model

We use a simple branching model with two main branches:

### Main Branches

- **`main`**: Production branch
  - Uses mainnet/real blockchain networks
  - Auto-deploys to Vercel Production
  - Protected branch (requires PR review)
  - Environment: `.env.production`

- **`develop`**: Staging branch
  - Uses testnet blockchain networks (Sepolia, Arbitrum Sepolia, etc.)
  - Auto-deploys to Vercel Preview
  - Environment: `.env.staging`

### Feature Branches

- **Feature branches**: `feature/*`, `fix/*`, `chore/*`
  - Created from `develop` branch
  - Merged into `develop` first for testing
  - After validation, merged into `main` for production
  - Environment: `.env.development` (local) or `.env.staging` (Vercel Preview)

## Environment Mapping

| Branch           | Environment File   | Blockchain Network                      | Deployment Target |
| ---------------- | ------------------ | --------------------------------------- | ----------------- |
| `main`           | `.env.production`  | Mainnet (real chains)                   | Vercel Production |
| `develop`        | `.env.staging`     | Testnets (Sepolia, Arbitrum Sepolia)    | Vercel Preview    |
| Feature branches | `.env.development` | Local Anvil (dev) or Testnets (preview) | Vercel Preview    |

## Workflow

### Development Workflow

1. **Create feature branch from `develop`**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop locally**:
   - Use `.env.development` with local Anvil blockchain
   - Run `pnpm dev:local` to start local development

3. **Test on staging**:
   - Push feature branch to GitHub
   - Vercel automatically creates Preview deployment
   - Preview uses `.env.staging` with testnets

4. **Merge to `develop`**:

   ```bash
   git checkout develop
   git merge feature/my-feature
   git push origin develop
   ```

   - Auto-deploys to Vercel Preview (staging environment)

5. **Merge to `main`** (after validation):

   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

   - Auto-deploys to Vercel Production (production environment)

### Hotfix Workflow

For urgent production fixes:

1. Create hotfix branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. Fix and test locally

3. Merge to both `main` and `develop`:

   ```bash
   git checkout main
   git merge hotfix/critical-fix
   git push origin main

   git checkout develop
   git merge hotfix/critical-fix
   git push origin develop
   ```

## Deployment Triggers

### Vercel Deployments

- **Production**: Automatic on push to `main` branch
  - Uses `.env.production` environment variables
  - Connects to mainnet blockchain networks

- **Preview/Staging**: Automatic on push to `develop` or feature branches
  - Uses `.env.staging` environment variables (for `develop` branch)
  - Uses `.env.development` environment variables (for feature branches)
  - Connects to testnet blockchain networks

### CI/CD Workflows

GitHub Actions workflows run on:

- **All PRs**: Quality checks (lint, type check, build)
- **All PRs**: Tests with local Anvil blockchain
- **`main` branch**: Full test suite + deployment
- **`develop` branch**: Full test suite + deployment

## Environment Variables

Environment variables are configured per environment:

- **Local Development**: `.env.development` or `.env.local`
- **Staging**: `.env.staging` (set in Vercel dashboard for `develop` branch)
- **Production**: `.env.production` (set in Vercel dashboard for `main` branch)

See [Environment Strategy](./environment-strategy.md) for detailed configuration.

## Best Practices

1. **Always branch from `develop`** for new features
2. **Test locally** with `.env.development` before pushing
3. **Validate on staging** (Vercel Preview) before merging to `main`
4. **Never push directly to `main`** - use PRs
5. **Keep `develop` stable** - it's the staging environment
6. **Use descriptive branch names**: `feature/description`, `fix/description`, `chore/description`

## Related Documentation

- [Environment Strategy](./environment-strategy.md)
- [Deployment Guide](./deployment-guide.md)
- [ADR 014: Environment Strategy](../.adrs/014-environment-strategy.md)

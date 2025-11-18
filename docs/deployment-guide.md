# Deployment Guide

This guide explains how to deploy the monorepo applications to different environments.

> 📘 **See also**: [Deployment and Branching Strategy](./deployment-and-branching-strategy.md) for comprehensive documentation on branching strategy, deployment targets, and CI/CD integration.

## Overview

The monorepo uses Vercel for deployments with automatic deployments based on git branches:

- **`main` branch** → Vercel Production → Production environment → Mainnet
- **`develop` branch** → Vercel Preview → Staging environment → Testnets
- **Feature branches** → Vercel Preview → Development environment → Testnets

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **GitHub Integration**: Connect your GitHub repository to Vercel
4. **Environment Variables**: Configure in Vercel dashboard

## Environment Configuration

### Vercel Dashboard Setup

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Configure variables per environment:

#### Production (main branch)

```
DYNAMIC_ENVIRONMENT_ID=your_production_environment_id
DYNAMIC_API_TOKEN=your_production_api_token
ENCRYPTION_KEY=your_32_char_encryption_key
USE_LOCAL_BLOCKCHAIN=false
RPC_URL_42161=https://arbitrum-mainnet.infura.io/v3/your_key
RPC_URL_8453=https://base-mainnet.infura.io/v3/your_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NODE_ENV=production
```

#### Preview/Staging (develop branch)

```
DYNAMIC_ENVIRONMENT_ID=your_staging_environment_id
DYNAMIC_API_TOKEN=your_staging_api_token
ENCRYPTION_KEY=your_32_char_encryption_key
USE_LOCAL_BLOCKCHAIN=false
RPC_URL_421614=https://arbitrum-sepolia.infura.io/v3/your_key
RPC_URL_84532=https://base-sepolia.infura.io/v3/your_key
SOLANA_RPC_URL=https://api.testnet.solana.com
NODE_ENV=staging
```

#### Next.js Apps (web, mathler)

For each Next.js app, add:

**Production:**

```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_production_environment_id
NEXT_PUBLIC_API_URL=https://vencura-api.vercel.app
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

**Preview/Staging:**

```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_staging_environment_id
NEXT_PUBLIC_API_URL=https://vencura-api-staging.vercel.app
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging
```

## Deployment Workflow

### 1. Development → Staging

1. **Create feature branch**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Develop locally**:

   ```bash
   # Start local development with Anvil
   pnpm dev:local
   ```

3. **Push to GitHub**:

   ```bash
   git push origin feature/my-feature
   ```

   - Vercel automatically creates Preview deployment
   - Preview uses staging environment variables

4. **Merge to develop**:

   ```bash
   git checkout develop
   git merge feature/my-feature
   git push origin develop
   ```

   - Auto-deploys to Vercel Preview (staging environment)

### 2. Staging → Production

1. **Validate on staging**:
   - Test the staging deployment
   - Verify all features work correctly

2. **Merge to main**:

   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

   - Auto-deploys to Vercel Production

3. **Verify production deployment**:
   - Check Vercel dashboard for deployment status
   - Test production endpoints
   - Monitor error tracking (Sentry)

## Manual Deployment

### Using Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   # Deploy to preview
   cd apps/web
   vercel

   # Deploy to production
   vercel --prod
   ```

### Using GitHub Actions

GitHub Actions workflows automatically deploy on push to `main` or `develop` branches.

**Required Secrets:**

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Deployment Targets

### Apps

- **`apps/web`** - Vencura Web UI
  - Production: `https://vencura-web.vercel.app`
  - Staging: `https://vencura-web-git-develop.vercel.app`

- **`apps/api`** - Vencura API
  - Production: `https://vencura-api.vercel.app`
  - Staging: `https://vencura-api-git-develop.vercel.app`

- **`apps/mathler`** - Mathler Game
  - Production: `https://vencura-mathler.vercel.app`
  - Staging: `https://vencura-mathler-git-develop.vercel.app`

## Monitoring

### Vercel Dashboard

- **Deployments**: View deployment history and status
- **Logs**: Real-time logs for each deployment
- **Analytics**: Performance metrics and usage statistics

### Error Tracking

- **Sentry**: Configured for all environments
- **Environment tags**: Automatically tagged by environment
- **Alerts**: Set up alerts for production errors

## Troubleshooting

### Deployment Fails

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Check build command** in `vercel.json`
4. **Verify dependencies** are installed correctly

### Environment Variables Not Loading

1. **Check NODE_ENV** is set correctly
2. **Verify file names** match environment (`.env.development`, `.env.staging`, `.env.production`)
3. **Check Vercel dashboard** for environment variable configuration
4. **Verify variable names** match exactly (case-sensitive)

### Blockchain Connection Issues

1. **Check RPC URLs** are correct for the environment
2. **Verify USE_LOCAL_BLOCKCHAIN** is set correctly (should be `false` for staging/production)
3. **Check RPC provider** status and rate limits
4. **Verify chain IDs** match the network

## Rollback

### Vercel Dashboard

1. Go to **Deployments** page
2. Find the previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Vercel CLI

```bash
vercel rollback [deployment-url]
```

## Related Documentation

- [Environment Strategy](./environment-strategy.md) - Environment variable configuration
- [Git Workflow](./git-workflow.md) - Branching strategy
- [ADR 014: Environment Strategy](../.adrs/014-environment-strategy.md) - Architecture decision record

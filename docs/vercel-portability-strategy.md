# Vercel Portability Strategy

This document outlines the portability strategy for the Vencura API, ensuring that the application can be deployed to any platform without vendor lock-in while still allowing pragmatic use of Vercel-specific features when justified.

## Core Principle: Portable by Default

**Critical architectural principle**: Our stack is designed for portability and runs on any Linux distribution:

- **Default approach**: Avoid vendor-specific features to maintain portability
- **Pragmatic exceptions**: Can leverage vendor features (e.g., Vercel edge functions, optimizations) when scaling/performance needs justify from product/business perspective
- **Platform-agnostic**: Can be deployed to any containerized platform (Docker, Kubernetes, etc.)
- **Vercel as convenience**: Vercel is chosen for rapid deployment and excellent developer experience, not as a requirement
- **All core components** can be migrated to any platform without code changes

## Portable Features

All of these features work identically on any platform:

### Application Code

- **NestJS Application**: Standard NestJS application with no Vercel-specific code
- **API Endpoints**: All endpoints use standard Express/NestJS patterns
- **Authentication**: Dynamic Labs JWT authentication (works everywhere)
- **Database**: DrizzleORM with PGLite (dev) or Postgres (prod) - platform agnostic
- **Encryption Service**: AES-256-GCM encryption using Node.js crypto (standard)
- **Error Handling**: Standard NestJS exception filters
- **Validation**: class-validator for DTOs, zod for env vars (standard libraries)

### Infrastructure Components

- **Docker Support**: Application can be containerized and run anywhere
- **Environment Variables**: Standard process.env (works on all platforms)
- **Secrets Management**: Can use any secrets manager (Vercel, GCP Secret Manager, AWS Secrets Manager, etc.)
- **Database Connections**: Standard Postgres connection strings
- **Logging**: Standard console.log (can be replaced with any logger)

### Security Features

- **Security Headers**: Helmet.js (works on any Express app)
- **Request Size Limits**: Express body parser limits (standard)
- **CORS**: NestJS CORS configuration (standard)
- **Request ID Middleware**: Custom middleware using standard Express patterns
- **Rate Limiting**: @nestjs/throttler (works on any NestJS app)

## Vercel-Specific Features (Optional)

These features are Vercel-specific but are **optional** and can be replaced with portable alternatives:

### Vercel Edge Functions

- **Status**: Not used in this application
- **Alternative**: Standard Node.js serverless functions (AWS Lambda, Cloud Functions, etc.)
- **Migration**: No migration needed - not used

### Vercel Analytics

- **Status**: Not used
- **Alternative**: Any analytics solution (Google Analytics, Mixpanel, etc.)
- **Migration**: No migration needed - not used

### Vercel Speed Insights

- **Status**: Not used
- **Alternative**: Any performance monitoring (New Relic, Datadog, etc.)
- **Migration**: No migration needed - not used

### Vercel KV/Postgres

- **Status**: Not used - we use standard Postgres
- **Alternative**: Any Postgres database (Cloud SQL, RDS, etc.)
- **Migration**: Already using portable Postgres

### Vercel Environment Variables

- **Status**: Used for configuration
- **Alternative**: Any environment variable management (GCP Secret Manager, AWS Secrets Manager, etc.)
- **Migration**: Standard process.env - works everywhere

## Migration Paths

### To Google Cloud Run

Already documented in [Google Cloud Deployment Option](../docs/google-cloud-deployment.md):

1. Use existing Dockerfile
2. Deploy to Cloud Run using Pulumi
3. Use Cloud SQL for Postgres
4. Use Secret Manager for secrets
5. No code changes required

### To AWS Lambda/ECS

1. **Lambda**: Wrap NestJS app in Lambda handler (use `@nestjs/platform-express` adapter)
2. **ECS**: Use existing Dockerfile, deploy to ECS Fargate
3. **Database**: Use RDS Postgres
4. **Secrets**: Use AWS Secrets Manager
5. **Code Changes**: Minimal - mainly deployment configuration

### To Railway/Render/Fly.io

1. Use existing Dockerfile
2. Configure environment variables in platform dashboard
3. Connect to Postgres database (platform-managed or external)
4. Deploy via Git push or Docker image
5. **Code Changes**: None required

### To Self-Hosted Docker

1. Use existing Dockerfile
2. Run with `docker run` or docker-compose
3. Configure environment variables
4. Connect to Postgres database
5. **Code Changes**: None required

## Vercel Configuration

The `vercel.json` configuration file (if present) contains:

```json
{
  "buildCommand": "pnpm build --filter=vencura",
  "outputDirectory": "apps/vencura/dist",
  "framework": null,
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.js"
    }
  ]
}
```

**Migration Note**: This configuration is Vercel-specific but doesn't affect code portability. When migrating to other platforms:

- **Google Cloud Run**: Use Dockerfile, no vercel.json needed
- **AWS Lambda**: Use Lambda-specific configuration
- **Railway/Render**: Use platform-specific configuration files
- **Self-hosted**: Use Dockerfile directly

## Code Portability Checklist

When adding new features, ensure they are portable:

- ✅ Use standard Node.js APIs
- ✅ Use standard npm packages (not Vercel-specific)
- ✅ Avoid Vercel-specific imports or APIs
- ✅ Use environment variables for configuration
- ✅ Use standard Express/NestJS patterns
- ✅ Test with Docker locally
- ❌ Avoid Vercel Edge Runtime APIs
- ❌ Avoid Vercel-specific environment variables (unless optional)
- ❌ Avoid Vercel KV or other Vercel-only services

## When to Use Vercel-Specific Features

Use Vercel-specific features when:

1. **Performance Justification**: Feature provides significant performance improvement
2. **Business Justification**: Feature enables important business functionality
3. **Cost Justification**: Feature reduces costs significantly
4. **Documented Decision**: Decision is documented in ADR with migration path

**Example**: Using Vercel Edge Functions for a high-traffic endpoint that benefits from edge caching - acceptable if documented and migration path exists.

## Testing Portability

To verify portability:

1. **Docker Test**: Build and run Docker image locally
2. **Environment Variables**: Test with standard env vars (not Vercel-specific)
3. **Database**: Test with standard Postgres connection string
4. **No Vercel Imports**: Ensure no Vercel-specific imports in code

## Summary

The Vencura API is designed to be **portable by default**:

- ✅ All core features work on any platform
- ✅ No Vercel-specific code in application
- ✅ Standard Dockerfile for containerization
- ✅ Standard environment variables
- ✅ Standard database connections
- ✅ Migration paths documented for major platforms

Vercel is used for **convenience and developer experience**, not as a requirement. The application can be migrated to any platform with minimal code changes.

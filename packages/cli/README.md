# @repo/cli

TypeScript CLI to interact with the Vencura Wallet API via `@repo/core`. API key auth only; auth endpoints excluded. Ideal for agentic integrations (e.g. OpenClaw) and scripting wallet operations.

## Usage

```bash
pnpm --filter @repo/cli build
node packages/cli/dist/cli.js --help
```

## Auth

Requires an API key. Resolved in order:

1. `VENCURA_API_KEY` env var
2. Config file (`~/.config/vencura/config.json` or `$XDG_CONFIG_HOME/vencura/config.json`)
3. Interactive prompt (saves to config)

```bash
# Set via env
export VENCURA_API_KEY=venc_xxx_yyy

# Or save to config
vencura config set-api-key venc_xxx_yyy
```

## Commands

Commands mirror the core API nesting (excluding auth endpoints): `health-check`, `account apikeys create`, `account apikeys list`, `ai chat`, etc. Use `--help` on any command for OpenAPI-derived descriptions.

## Local testing

1. Start API: `pnpm dev`
2. Create API key via dashboard or `POST /account/apikeys/` with JWT
3. Run:

   ```bash
   VENCURA_API_KEY=venc_xxx node packages/cli/dist/cli.js health-check
   VENCURA_API_KEY=venc_xxx node packages/cli/dist/cli.js account apikeys list
   ```

4. Or build and run:

   ```bash
   pnpm --filter @repo/cli build
   pnpm --filter @repo/cli exec vencura health-check
   ```

## Agentic integrations

The CLI is designed for AI agents (OpenClaw, Cursor Composer, etc.) as a lightweight alternative to MCP: standard stdout/JSON, no server setup, easy to wrap in scripts.

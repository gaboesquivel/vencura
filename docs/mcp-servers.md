# MCP Servers Usage Guide

This document describes how we use Model Context Protocol (MCP) servers in our development workflow with Cursor Composer 1.

## Overview

MCP servers extend AI assistants (like Cursor's Composer) with specialized capabilities, allowing them to interact with external services and tools directly. This enables more powerful AI-assisted development workflows.

## Configured MCP Servers

Our project uses the following MCP servers, configured in [`.cursor/mcp.json`](../.cursor/mcp.json):

### 1. Shadcn MCP

**Purpose**: UI component management using shadcn/ui

**Capabilities**:

- Search and browse shadcn/ui components
- Add components to the project
- View component examples and documentation

**Authentication**: Uses local CLI command execution (no API key required)

**Usage**: When working with UI components, the AI can search for and add shadcn/ui components directly.

### 2. v0.dev MCP

**Purpose**: UI design and component generation

**Capabilities**:

- Generate React components from descriptions
- Access v0.dev's component library
- Create UI designs and layouts

**Authentication**: Requires `V0_API_KEY` environment variable

**Usage**: Ask the AI to generate UI components or designs, and it will use v0.dev's capabilities.

### 3. GitHub MCP

**Purpose**: GitHub repository management and operations

**Capabilities**:

- Read repository files and structure
- Create and manage issues
- Manage pull requests
- Access repository metadata

**Authentication**: Requires `GITHUB_TOKEN` environment variable

**Usage**: The AI can interact with GitHub repositories, read code, and manage issues/PRs.

### 4. Vercel MCP

**Purpose**: Vercel deployment and project management

**Capabilities**:

- List and manage deployments
- Get deployment details and build logs
- Manage domains and check availability
- Access project information
- Create shareable links for protected deployments
- Fetch content from Vercel deployments

**Authentication**: Requires `VERCEL_API_TOKEN` environment variable

**Usage**: The AI can deploy projects, check deployment status, view build logs, and manage Vercel resources.

#### Vercel's 2024 Backend Improvements

Vercel has made significant improvements in 2024 to support backend frameworks like NestJS:

- **Zero-configuration NestJS support**: Deploy NestJS applications without manual configuration
- **Fluid Compute with Active CPU pricing**: Automatic scaling with pay-for-what-you-use pricing model
- **Reduced cold starts**: Significantly improved cold start times for backend APIs
- **Native support for long-running applications**: Better support for traditional backend APIs

**Note**: Vercel is a deployment convenience - the stack remains portable to any Linux platform. Our default approach avoids Vercel-specific features to maintain portability, but we can leverage them pragmatically when scaling/performance needs justify it from a product/business perspective.

## Using MCP Servers with Cursor Composer 1

### Setup

1. Ensure environment variables are set:
   - `V0_API_KEY` (for v0.dev)
   - `GITHUB_TOKEN` (for GitHub)
   - `VERCEL_API_TOKEN` (for Vercel)

2. MCP servers are automatically loaded when Cursor starts

3. In Composer 1, you can reference MCP capabilities in your prompts

### Example Prompts

**Using Shadcn MCP**:

```
Add a shadcn/ui button component to the login page
```

**Using v0.dev MCP**:

```
Generate a dashboard layout component using v0.dev
```

**Using GitHub MCP**:

```
Check the latest issues in the repository
```

**Using Vercel MCP**:

```
Deploy this project to Vercel
Show me the build logs for the latest deployment
Check if mydomain.com is available
```

## Authentication Setup

### Getting API Keys

1. **V0_API_KEY**: Get from [v0.dev](https://v0.dev) account settings
2. **GITHUB_TOKEN**: Create a personal access token at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
3. **VERCEL_API_TOKEN**: Get from [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)

### Setting Environment Variables

Add these to your shell profile (`.zshrc`, `.bashrc`, etc.) or use a `.env` file:

```bash
export V0_API_KEY=your_v0_api_key
export GITHUB_TOKEN=your_github_token
export VERCEL_API_TOKEN=your_vercel_api_token
```

## Best Practices

1. **Use MCP servers for repetitive tasks**: Let the AI handle deployment, component management, and repository operations
2. **Verify MCP actions**: Always review what the AI is doing, especially for deployments and repository changes
3. **Keep API keys secure**: Never commit API keys to version control
4. **Use appropriate MCP for the task**: Each MCP server has specific capabilities - use the right one for the job
5. **Portability first**: When using Vercel MCP, remember our portable-by-default principle - avoid vendor-specific features unless justified

## Resources

- [Vercel MCP Tools Documentation](https://vercel.com/docs/mcp/vercel-mcp/tools)
- [Cursor MCP Documentation](https://cursor.com/docs/context/model-context-protocol)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## YouTube Videos

For visual guides on using MCP servers, see:

- Vercel MCP tutorials and demos (check [Vercel's MCP documentation](https://vercel.com/docs/mcp/vercel-mcp/tools) for latest videos)

# ADR 002: Vencura API Framework

## Context

We need to select a framework for building the Vencura backend API that:

- Supports TypeScript
- Provides robust dependency injection and modular architecture
- Handles WebSockets for real-time features
- Integrates well with our monorepo structure
- Has strong ecosystem support and tooling
- Enables fast development with good developer experience

## Considered Options

### Option A – NestJS

Progressive Node.js framework with decorators and dependency injection.

**Pros**

- Built-in dependency injection system
- Modular architecture with clear separation of concerns
- Native WebSocket gateway support with `@WebSocketGateway()`
- Platform-agnostic WebSocket support (socket.io and ws)
- Mature ecosystem with extensive documentation
- Strong TypeScript support out of the box
- Excellent CLI for scaffolding and code generation
- Built-in validation with class-validator
- Swagger/OpenAPI integration
- Works well with pnpm workspaces and Turbo

**Cons**

- Steeper learning curve for developers new to decorators
- More opinionated framework (less flexibility)
- Larger bundle size compared to minimal frameworks
- Requires Node.js runtime (not suitable for edge/serverless)

### Option B – Hono.js

Ultrafast web framework for the Edge.

**Pros**

- Very fast performance
- Designed for edge environments and serverless
- Lightweight and minimal

**Cons**

- Designed for edge/serverless, less suitable for traditional backend applications
- WebSocket support is more limited compared to NestJS
- No built-in dependency injection system
- Newer framework with smaller ecosystem
- Less community resources and examples
- Team has more experience with NestJS patterns

### Option C – Express.js

Minimal and flexible Node.js web framework.

**Pros**

- Very flexible and unopinionated
- Large ecosystem and community
- Simple to get started

**Cons**

- Minimal framework requires more boilerplate
- No built-in dependency injection
- Less opinionated, leading to inconsistent patterns
- WebSocket support requires additional libraries and setup
- Less TypeScript-first approach
- More manual type definitions needed

### Option D – Fastify

Fast and low overhead web framework.

**Pros**

- Fast performance
- Low overhead
- Good TypeScript support

**Cons**

- Smaller ecosystem compared to NestJS
- Less opinionated structure
- No built-in dependency injection
- WebSocket support requires additional setup
- Less integrated compared to NestJS

## Decision

We will use **NestJS** as our backend API framework.

**Main reasons:**

- Built-in dependency injection system and modular architecture for scalable applications
- Native WebSocket gateway support with platform-agnostic options (socket.io and ws)
- Mature ecosystem with extensive documentation and strong TypeScript support
- Excellent CLI for scaffolding and built-in validation with class-validator
- Works well with pnpm workspaces and Turbo for monorepo integration

## Notes

- Hono.js may be reconsidered for edge functions or serverless deployments
- NestJS continues to evolve with new features and improvements
- Consider framework-agnostic patterns when building shared utilities

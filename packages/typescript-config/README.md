# `@workspace/typescript-config`

Shared TypeScript configuration for the workspace. Provides consistent TypeScript compiler settings across all packages and apps in the monorepo.

## Available Configurations

### Base Configuration (`base.json`)

Base TypeScript configuration that all other configs extend. Suitable for Node.js projects.

**Features:**

- Strict type checking enabled
- ES2022 target
- Node.js module resolution
- Declaration files generation
- No unchecked indexed access

**Usage:**

```json
// tsconfig.json
{
  "extends": "@workspace/typescript-config/base"
}
```

### Next.js Configuration (`nextjs.json`)

TypeScript configuration for Next.js applications. Extends the base configuration.

**Features:**

- All base configuration features
- Next.js plugin support
- ESNext modules
- Bundler module resolution
- JSX preserve mode
- No emit (Next.js handles compilation)

**Usage:**

```json
// tsconfig.json
{
  "extends": "@workspace/typescript-config/nextjs"
}
```

### React Library Configuration (`react-library.json`)

TypeScript configuration for React component libraries. Extends the base configuration.

**Features:**

- All base configuration features
- React JSX support
- Declaration files for library distribution

**Usage:**

```json
// tsconfig.json
{
  "extends": "@workspace/typescript-config/react-library"
}
```

## Installation

This package is part of the monorepo and is automatically available to all packages and apps. No separate installation needed.

## Configuration Details

### Base Configuration Options

- **Target**: ES2022
- **Module**: NodeNext
- **Module Resolution**: NodeNext
- **Strict Mode**: Enabled
- **Lib**: ES2022, DOM, DOM.Iterable
- **Declaration**: Enabled (for library packages)
- **No Unchecked Indexed Access**: Enabled (safer array/object access)

### Next.js Specific Options

- **Module**: ESNext
- **Module Resolution**: Bundler
- **JSX**: Preserve (Next.js handles transformation)
- **No Emit**: Enabled (Next.js handles compilation)
- **Allow JS**: Enabled (for gradual migration)

### React Library Specific Options

- **JSX**: react-jsx (automatic JSX runtime)
- **Declaration**: Enabled (inherited from base)

## Usage Examples

### NestJS Backend

```json
// apps/vencura/tsconfig.json
{
  "extends": "@workspace/typescript-config/base",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Next.js App

```json
// apps/vencura-ui/tsconfig.json
{
  "extends": "@workspace/typescript-config/nextjs",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### React Library

```json
// packages/ui/tsconfig.json
{
  "extends": "@workspace/typescript-config/react-library",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## License

PROPRIETARY

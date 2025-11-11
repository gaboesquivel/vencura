# `@workspace/ui`

Shared UI component library built with Shadcn/ui and Tailwind CSS for use across all frontend applications in the monorepo.

## Features

- **Shadcn/ui Components**: Pre-configured, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI Primitives**: Unstyled, accessible component primitives
- **TypeScript**: Full type safety
- **Theme Support**: Dark mode via `next-themes`

## Installation

This package is part of the monorepo and is automatically available to all apps. No separate installation needed.

## Usage

### Importing Components

```tsx
import { Button } from "@workspace/ui/components/button";
```

### Importing Utilities

```tsx
import { cn } from "@workspace/ui/lib/utils";
```

### Importing Styles

```tsx
// In your app's layout or global CSS
import "@workspace/ui/globals.css";
```

### Importing PostCSS Config

```tsx
// For Next.js apps that need to extend PostCSS config
import postcssConfig from "@workspace/ui/postcss.config";
```

## Available Exports

### Components

- `@workspace/ui/components/*` - All Shadcn/ui components (e.g., `button`, `card`, `input`, etc.)

### Utilities

- `@workspace/ui/lib/utils` - Utility functions including `cn()` for className merging

### Styles

- `@workspace/ui/globals.css` - Global Tailwind CSS styles and theme variables

### Hooks

- `@workspace/ui/hooks/*` - Shared React hooks

### PostCSS Config

- `@workspace/ui/postcss.config` - PostCSS configuration for Tailwind CSS

## Tech Stack

- **Shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible component primitives
- **React 19**: Latest React version
- **TypeScript**: Type-safe development
- **class-variance-authority**: For component variants
- **clsx** & **tailwind-merge**: For className utilities

## Development

```bash
# Lint
pnpm lint
```

## Adding New Components

To add new Shadcn/ui components:

1. Use the Shadcn CLI from any app directory:
   ```bash
   npx shadcn@latest add [component-name]
   ```
2. Point the `components.json` to this package's directory
3. Components will be added to `packages/ui/src/components/`

## License

PROPRIETARY

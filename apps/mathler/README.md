# Mathler

A Mathler game built with Next.js - like Wordle but with numbers. Users have 6 guesses to find the equation that equals a daily number.

## Current Status

⚠️ **This app is currently in early development** - it contains a basic Next.js setup with placeholder content. The game logic and features are not yet implemented.

## Planned Features

- Daily puzzles with changing target numbers
- Dynamic SDK integration for authentication
- User history stored in Dynamic metadata
- Color-coded feedback (green/yellow/grey tiles)
- Order of operations support
- Crypto-related features (NFT minting, token rewards, etc.)
- Keyboard and mouse controls
- Responsive UI/UX design

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Dynamic SDK (planned)
- Tailwind CSS
- Shadcn/ui components (via `@workspace/ui`)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/mathler
pnpm install
```

### Running the Application

```bash
# From monorepo root
pnpm dev

# Or from this directory
cd apps/mathler
pnpm dev
```

The application will be available at `http://localhost:3002` (or the next available port).

## Development

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Project Structure

```
mathler/
├── app/              # Next.js app directory
│   ├── page.tsx     # Main page component (placeholder)
│   └── layout.tsx   # Root layout
├── components/       # React components (to be implemented)
├── lib/              # Utilities (to be implemented)
└── hooks/            # React hooks (to be implemented)
```

## License

PROPRIETARY

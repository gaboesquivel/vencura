import { Card, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import {
  ArrowRightLeft,
  Blocks,
  Bot,
  FileCode2,
  Key,
  MessageCircle,
  PackageCheck,
  Palette,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

const features = [
  {
    icon: Wallet,
    title: 'Custodial Wallet API',
    description:
      'getBalance(), signMessage(), sendTransaction() — all wallet operations via backend API. Create and manage custodial wallets without exposing private keys.',
  },
  {
    icon: Key,
    title: 'Dynamic Auth',
    description:
      'Magic link, OAuth, Web3 sign-in, and API keys for programmatic access. Dynamic powers the authentication layer for Vencura Wallet.',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted Keys at Rest',
    description:
      'Private keys encrypted with AES-256-GCM; never logged or exposed. Rate limiting and address validation on wallet operations.',
  },
  {
    icon: PackageCheck,
    title: 'Auto-Generated SDKs',
    description:
      'Type-safe clients from OpenAPI for web, mobile, and CLI. One source of truth, zero manual sync.',
  },
  {
    icon: FileCode2,
    title: 'End-to-End Type Safety',
    description:
      'TypeScript from database to frontend with full IntelliSense support. Catch errors at compile time, not in production.',
  },
  {
    icon: Blocks,
    title: 'Next.js and Expo',
    description:
      'Dashboard and wallets UI for web; Expo app for mobile. Launch Vencura Wallet clients in days, not months.',
  },
  {
    icon: MessageCircle,
    title: 'AI Assistant Component',
    description:
      'Streaming AI chat UI with Vercel AI SDK, connected to your Fastify backend. Drop-in conversation assistant—no setup required.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Zero Vendor Lock-in',
    description:
      'Portable architecture that runs anywhere—your VPS, AWS, Vercel, or locally. Own your stack, control your costs.',
  },
  {
    icon: Bot,
    title: 'AI-Assisted Development',
    description:
      'Pre-configured rules and skills for Cursor and Claude. Ship features faster with AI pair programming that understands your codebase.',
  },
  {
    icon: Palette,
    title: 'ShadcnUI Design System',
    description:
      'Integrated ShadcnUI design system for consistent, reusable UI and theme support across all apps.',
  },
]

export function Features() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 md:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-10 text-center md:mb-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Everything you need for custodial wallets
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-muted-foreground md:mt-4 md:text-base">
            Backend API, Dynamic auth, encrypted keys, and typed SDKs. Build the Venmo of wallets.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <Card
              key={feature.title}
              className="border-border/50 bg-card transition-colors hover:border-border"
            >
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold sm:text-lg">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

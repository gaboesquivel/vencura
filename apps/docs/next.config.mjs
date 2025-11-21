import nextra from 'nextra'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const baseNextConfig = {
  transpilePackages: ["@vencura/ui"],
  // Suppress OpenTelemetry/Sentry warnings about external packages
  serverExternalPackages: [
    'import-in-the-middle',
    'require-in-the-middle',
  ],
}

// Set up Nextra with its configuration
const withNextra = nextra({
  // Add Nextra-specific options here
})

// Wrap base config with Nextra
const nextConfigWithNextra = withNextra(baseNextConfig)

// Only wrap with Sentry if DSN is configured
// eslint-disable-next-line no-undef
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export default sentryDsn
  ? withSentryConfig(nextConfigWithNextra, {
      silent: true,
      // eslint-disable-next-line no-undef
      org: process.env.SENTRY_ORG,
      // eslint-disable-next-line no-undef
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfigWithNextra

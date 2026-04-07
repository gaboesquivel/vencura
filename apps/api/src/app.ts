import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import AutoLoad, { type AutoloadPluginOptions } from '@fastify/autoload'
import type { FastifyPluginAsync } from 'fastify'

import { env } from './lib/env.js'

// Non-plugin modules under routes/ (imported by route files only). Keeps autoload from logging DEBUG skips.
const routeSupportModulesPattern =
  /^\/(schemas|wallets\/get-wallet-for-user|ai\/(?:upstream-error|provider|account-info-tool|brave-search)|reference\/(?:template-scripts|template-styles|template|dynamic-auth-browser))\.(ts|js)$/u

const appFile = fileURLToPath(import.meta.url)
const appDir = path.dirname(appFile)

export type AppOptions = {
  /** Override env.ALLOW_TEST (e.g. for OpenAPI generation to exclude test routes) */
  allowTest?: boolean
} & Partial<AutoloadPluginOptions>

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application

  void fastify.register(AutoLoad, {
    dir: path.join(appDir, 'plugins'),
    options: opts,
    forceESM: true,
    ignorePattern: /\.(spec|test)\.(ts|js)$/,
  })

  // This loads all plugins defined in routes
  // define your routes in one of these

  void fastify.register(AutoLoad, {
    dir: path.join(appDir, 'routes'),
    options: opts,
    forceESM: true,
    ignorePattern: /\.(spec|test)\.(ts|js)$/,
    ignoreFilter: filePath => {
      const allowTest = opts?.allowTest ?? env.ALLOW_TEST
      if (!allowTest && /\/test\//.test(filePath)) return true
      return routeSupportModulesPattern.test(filePath)
    },
  })
}

export default app
export { app, options }

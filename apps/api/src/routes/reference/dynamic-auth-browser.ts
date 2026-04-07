/**
 * Browser-only entry: bundled to reference-dynamic-auth.bundle.js for the Scalar reference page.
 */

import type { DynamicClient } from '@dynamic-labs-sdk/client'
import {
  authenticateWithSocial,
  completeSocialAuthentication,
  createDynamicClient,
  detectOAuthRedirect,
  signInWithPasskey,
  waitForClientInitialized,
} from '@dynamic-labs-sdk/client'

let clientRef: DynamicClient | null = null

export async function initReferenceDynamic({
  environmentId,
  appName,
}: {
  environmentId: string
  appName: string
}): Promise<void> {
  const url = window.location.origin
  const client = createDynamicClient({
    environmentId,
    metadata: { name: appName, url },
  })
  clientRef = client
  await waitForClientInitialized(client)
}

function client(): DynamicClient {
  if (!clientRef) throw new Error('Dynamic client not initialized')
  return clientRef
}

/** After OAuth redirect to /reference — complete flow and strip Dynamic query params from URL. */
export async function completeReferenceOAuthIfNeeded(): Promise<boolean> {
  const c = client()
  const url = new URL(window.location.href)
  if (!(await detectOAuthRedirect({ url }, c))) return false
  await completeSocialAuthentication({ url }, c)
  const clean = `${url.origin}${url.pathname}${url.hash}`
  window.history.replaceState({}, '', clean)
  return true
}

export async function loginWithGoogle(): Promise<void> {
  await authenticateWithSocial(
    { provider: 'google', redirectUrl: `${window.location.origin}${window.location.pathname}` },
    client(),
  )
}

export async function loginWithGithub(): Promise<void> {
  await authenticateWithSocial(
    { provider: 'github', redirectUrl: `${window.location.origin}${window.location.pathname}` },
    client(),
  )
}

export async function loginWithPasskey(): Promise<void> {
  await signInWithPasskey({}, client())
}

export function getAuthJwt(): string | null {
  return client().token
}

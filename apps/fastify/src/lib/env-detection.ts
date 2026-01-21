/**
 * Environment detection utilities
 * Determines the current runtime environment for appropriate database and migration handling
 */

export function isVercel(): boolean {
  return process.env.VERCEL === '1'
}

export function isVercelProduction(): boolean {
  return isVercel() && process.env.VERCEL_GIT_COMMIT_REF === 'main'
}

export function isVercelPreview(): boolean {
  return isVercel() && process.env.VERCEL_GIT_COMMIT_REF !== 'main'
}

export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !isVercel()
}

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test'
}

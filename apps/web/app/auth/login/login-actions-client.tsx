'use client'

import dynamic from 'next/dynamic'
import type { LoginActionsProps } from './login-actions'

const LoginActions = dynamic(
  () => import('./login-actions').then(m => ({ default: m.LoginActions })),
  { ssr: false },
)

export function LoginActionsClient(props: LoginActionsProps) {
  return <LoginActions {...props} />
}

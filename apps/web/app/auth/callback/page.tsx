import { redirect } from 'next/navigation'

type AuthCallbackPageProps = {
  searchParams: Promise<{
    error?: string
    message?: string
    callbackURL?: string
  }>
}

/** Fallback for auth callbacks. Dynamic handles auth in-app; legacy redirects land here. */
export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams
  const error = params.error || params.message

  if (error) redirect(`/auth/login?error=${encodeURIComponent(error)}`)

  const callbackURL = params.callbackURL?.startsWith('/') ? params.callbackURL : '/'
  redirect(callbackURL)
}

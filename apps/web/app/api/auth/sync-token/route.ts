import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setSyncTokenCookie } from '@/lib/auth/auth-server'

// Cookie: proxy + SSR only. Mobile uses JWT.
const syncTokenSchema = z.object({ token: z.string() })

export async function POST(request: Request) {
  try {
    const parsed = syncTokenSchema.safeParse(await request.json())
    if (!parsed.success)
      return new Response(JSON.stringify({ message: 'token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })

    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
    setSyncTokenCookie(response, parsed.data.token)
    return response
  } catch {
    return new Response(JSON.stringify({ message: 'Failed to sync token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

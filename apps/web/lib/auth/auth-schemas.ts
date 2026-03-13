import { z } from 'zod'

export const authCookieSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
})

export type AuthCookie = z.infer<typeof authCookieSchema>

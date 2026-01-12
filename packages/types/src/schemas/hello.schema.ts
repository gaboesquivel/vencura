export type HelloResponse = { message: string }

/**
 * Minimal runtime validator for the hello response.
 * Kept lightweight to avoid test bundler issues while still enforcing shape.
 */
export const HelloResponseSchema = {
  parse: (value: unknown): HelloResponse => {
    if (!value || typeof (value as { message?: unknown }).message !== 'string')
      throw new Error('Invalid HelloResponse: expected { message: string }')

    return { message: (value as { message: string }).message }
  },
}

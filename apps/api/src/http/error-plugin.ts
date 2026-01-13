import { Elysia } from 'elysia'
import { AppError, UnauthorizedError } from './errors'

export const errorPlugin = new Elysia()
  .error({ APP_ERROR: AppError, UNAUTHORIZED_ERROR: UnauthorizedError })
  .onError(({ code, error, set }) => {
    // Handle typed custom errors
    if (code === 'APP_ERROR') {
      const appError = error as AppError
      set.status = appError.status
      return appError.toResponse()
    }

    // Handle unauthorized errors
    if (code === 'UNAUTHORIZED_ERROR') {
      const unauthorizedError = error as UnauthorizedError
      set.status = unauthorizedError.status
      return unauthorizedError.toResponse()
    }

    // Normalize validation errors
    if (code === 'VALIDATION') {
      set.status = 400
      return {
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error, // Include structured validation error payload
      }
    }

    // Normalize routing NOT_FOUND
    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        error: 'NOT_FOUND',
        message: 'Not Found',
      }
    }

    // Default 500 handler for unexpected errors
    console.error('Unhandled error:', error)
    set.status = 500
    return {
      error: 'INTERNAL',
      message: 'Internal server error',
    }
  })

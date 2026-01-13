export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }

  toResponse() {
    return { error: this.code, message: this.message, details: this.details }
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details)
    this.name = 'UnauthorizedError'
  }
}

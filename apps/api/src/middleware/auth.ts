/**
 * Extract user ID from request headers.
 * For testing, allows bypass via X-Test-User-Id header.
 * In production, would extract from JWT token.
 */
export function getUserId(request: Request): string {
  // Test mode: allow bypass via header
  const testUserId = request.headers.get('X-Test-User-Id')
  if (testUserId) {
    return testUserId
  }

  // Production: extract from Authorization header JWT
  // For now, return a default test user ID
  // TODO: Implement proper JWT extraction
  return 'test-user-123'
}

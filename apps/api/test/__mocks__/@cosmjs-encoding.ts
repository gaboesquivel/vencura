// Mock for @cosmjs/encoding ESM package
export function fromBech32(address: string): { prefix: string; data: Uint8Array } {
  // Simple mock implementation for testing
  if (!address.includes('1')) {
    throw new Error('Invalid bech32 address')
  }
  const parts = address.split('1')
  return {
    prefix: parts[0] || '',
    data: new Uint8Array(20), // Mock data
  }
}

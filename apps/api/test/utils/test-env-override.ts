export async function withTestEnvOverride<T>(
  name: string,
  value: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = process.env[name]
  process.env[name] = value
  try {
    return await fn()
  } finally {
    if (prev !== undefined) process.env[name] = prev
    else delete process.env[name]
  }
}

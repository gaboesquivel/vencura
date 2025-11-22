import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'
import { zEnv } from '../lib/env'

const algorithm = 'aes-256-gcm'
const keyLength = 32
const ivLength = 16

async function getKey(): Promise<Buffer> {
  const encryptionKey = zEnv.ENCRYPTION_KEY
  const salt = Buffer.from(encryptionKey.slice(0, 16), 'utf8')
  return (await promisify(scrypt)(encryptionKey, salt, keyLength)) as Buffer
}

/**
 * Encrypt key share using AES-256-GCM with Base64 encoding.
 * Format: `${ivBase64}:${authTagBase64}:${encryptedBase64}`
 */
export async function encryptKeyShare(text: string): Promise<string> {
  const key = await getKey()
  const iv = randomBytes(ivLength)
  const cipher = createCipheriv(algorithm, key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypt key share using AES-256-GCM with Base64 encoding.
 * Expects format: `${ivBase64}:${authTagBase64}:${encryptedBase64}`
 */
export async function decryptKeyShare(encryptedText: string): Promise<string> {
  const key = await getKey()
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted format')

  const [ivBase64, authTagBase64, encryptedBase64] = parts
  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error('Invalid encrypted format')
  }

  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  const encrypted = Buffer.from(encryptedBase64, 'base64')

  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

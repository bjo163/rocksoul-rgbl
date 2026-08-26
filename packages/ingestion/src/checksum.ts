import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function sha256File(file: string): Promise<{ sha256: string; byteSize: number }> {
  const bytes = await readFile(file)
  return { sha256: sha256Bytes(bytes), byteSize: bytes.byteLength }
}

export function verifyPinnedBytes(bytes: Uint8Array, expectedSha256: string, expectedByteSize?: number): string {
  const actual = sha256Bytes(bytes)
  if (actual !== expectedSha256) throw new Error(`SHA-256 mismatch: expected ${expectedSha256}, received ${actual}`)
  if (expectedByteSize !== undefined && bytes.byteLength !== expectedByteSize) {
    throw new Error(`Byte-size mismatch: expected ${expectedByteSize}, received ${bytes.byteLength}`)
  }
  return actual
}

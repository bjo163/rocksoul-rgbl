import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { AcquisitionResult, FilesystemAcquisition } from '../types.js'
import { verifyPinnedBytes } from '../checksum.js'

export async function acquireFilesystem(source: FilesystemAcquisition, recipeDir: string): Promise<AcquisitionResult> {
  if (path.isAbsolute(source.path)) throw new Error('Filesystem acquisition path must be relative to the recipe directory')
  const root = path.resolve(recipeDir)
  const file = path.resolve(root, source.path)
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) throw new Error('Filesystem acquisition path escapes the recipe directory')
  const bytes = await readFile(file)
  const sha256 = verifyPinnedBytes(bytes, source.sha256, source.byte_size)
  return { bytes, source, resolved_location: file, sha256 }
}

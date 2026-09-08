import { formatCanonicalPosition } from '../identity/canonical-position.js'
import type { CanonicalPosition } from '../identity/types.js'

export function buildAlignmentKey(
  workId: string,
  position: CanonicalPosition | string
): string {
  const posStr = typeof position === 'string' ? position : formatCanonicalPosition(position)
  return `mw:align:${workId}:${posStr}`
}

export function buildEditionKey(
  workId: string,
  language: string,
  variantOrSource?: string
): string {
  const cleanLang = language.toLowerCase().trim()
  if (variantOrSource) {
    const cleanVariant = variantOrSource.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    return `mw:edition:${workId}:${cleanLang}:${cleanVariant}`
  }
  return `mw:edition:${workId}:${cleanLang}`
}

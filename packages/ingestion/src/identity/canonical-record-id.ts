import type { CanonicalPosition } from './types.js'
import { formatCanonicalPosition } from './canonical-position.js'

export function buildCanonicalRecordId(workId: string, position: CanonicalPosition | string): string {
  const cleanWorkId = workId.toLowerCase().trim()
  const posStr = typeof position === 'string' ? position : formatCanonicalPosition(position)
  if (!posStr) throw new Error(`Cannot construct canonical record ID for work '${workId}' without valid position`)
  return `mw:${cleanWorkId}:${posStr}`
}

export function parseCanonicalRecordId(id: string): {
  prefix: string
  workId: string
  positionString: string
} {
  const parts = id.split(':')
  if (parts.length < 3 || parts[0] !== 'mw') {
    throw new Error(`Invalid canonical record ID format: '${id}'`)
  }
  const workId = parts[1]
  const positionString = parts.slice(2).join(':')
  return {
    prefix: 'mw',
    workId,
    positionString
  }
}

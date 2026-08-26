import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { CurationOperation, CurationOverlay } from './types.js'

function decodePointerSegment(segment: string): string {
  return segment.replaceAll('~1', '/').replaceAll('~0', '~')
}

function pointerSegments(pointer: string): string[] {
  if (!pointer.startsWith('/') || pointer === '/') throw new Error(`Curation path must be a non-root JSON Pointer: ${pointer}`)
  return pointer.slice(1).split('/').map(decodePointerSegment)
}

function cloneRecord(record: CorpusRecord): CorpusRecord {
  return structuredClone(record)
}

function applyOperation(record: CorpusRecord, operation: CurationOperation): void {
  const segments = pointerSegments(operation.path)
  let current: unknown = record
  for (const segment of segments.slice(0, -1)) {
    if (!current || typeof current !== 'object') throw new Error(`Curation path does not exist: ${operation.path}`)
    current = (current as Record<string, unknown>)[segment]
  }
  if (!current || typeof current !== 'object') throw new Error(`Curation path does not exist: ${operation.path}`)
  const parent = current as Record<string, unknown>
  const key = segments.at(-1)!
  if (operation.op === 'remove') {
    if (!(key in parent)) throw new Error(`Cannot remove missing curation path: ${operation.path}`)
    delete parent[key]
  } else if (operation.op === 'replace') {
    if (!(key in parent)) throw new Error(`Cannot replace missing curation path: ${operation.path}`)
    parent[key] = structuredClone(operation.value)
  } else {
    if (key in parent) throw new Error(`Cannot add existing curation path: ${operation.path}`)
    parent[key] = structuredClone(operation.value)
  }
}

export function applyCurationOverlays(records: CorpusRecord[], overlays: CurationOverlay[]): { records: CorpusRecord[]; operations: CurationOperation[] } {
  const byId = new Map(records.map((record) => [record.id, cloneRecord(record)]))
  const operations: CurationOperation[] = []
  for (const overlay of overlays) {
    for (const operation of overlay.operations) {
      const record = byId.get(operation.target)
      if (!record) throw new Error(`Curation target does not exist: ${operation.target}`)
      applyOperation(record, operation)
      operations.push(operation)
    }
  }
  return { records: [...byId.values()], operations }
}

export type PatchOperation = 'add' | 'replace' | 'remove'

export interface CurationPatchInput {
  operation: PatchOperation
  target: string
  path: string
  reason: string
  curator: string
  provenance: string
  value?: unknown
}

export function buildCurationOverlay(input: CurationPatchInput): { version: '0.1'; operations: Array<Record<string, unknown>> } {
  if (!input.target.trim() || !input.path.startsWith('/') || input.path === '/') throw new Error('Target and non-root JSON Pointer are required')
  if (!input.reason.trim() || !input.curator.trim() || !input.provenance.trim()) throw new Error('Reason, curator, and provenance are required')
  const operation: Record<string, unknown> = {
    op: input.operation,
    target: input.target,
    path: input.path,
    reason: input.reason,
    curator: input.curator,
    provenance: input.provenance
  }
  if (input.operation !== 'remove') operation.value = input.value ?? ''
  return { version: '0.1', operations: [operation] }
}

import type { CanonicalId } from './identifiers.js'

export const RECORD_LIFECYCLE_STATUSES = ['current', 'superseded', 'retired'] as const

export type RecordLifecycleStatus = (typeof RECORD_LIFECYCLE_STATUSES)[number]

/**
 * Universal lifecycle metadata for a canonical corpus record.
 *
 * Absence of this envelope means `current`. Workflow review state, theological
 * status, publication status, and source validity are intentionally not modeled here.
 */
export interface RecordLifecycle {
  status: RecordLifecycleStatus
  /** Canonical successor(s). Only valid when status is `superseded`. */
  replacements?: CanonicalId[]
  /** Human-readable explanation for the lifecycle transition. */
  reason?: string
}

export function isRecordLifecycleStatus(value: unknown): value is RecordLifecycleStatus {
  return typeof value === 'string' && (RECORD_LIFECYCLE_STATUSES as readonly string[]).includes(value)
}

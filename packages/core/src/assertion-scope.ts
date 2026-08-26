import { assertCanonicalId, type CanonicalId } from './identifiers.js'

export const ASSERTION_SCOPE_FIELDS = ['tradition', 'community', 'agent', 'period', 'place'] as const
export type AssertionScopeField = (typeof ASSERTION_SCOPE_FIELDS)[number]

/** Universal contextual dimensions that qualify an assertion without changing its subject/object model. */
export interface AssertionScope {
  tradition?: CanonicalId
  community?: CanonicalId
  agent?: CanonicalId
  period?: CanonicalId
  place?: CanonicalId
}

export function assertAssertionScope(input: unknown): asserts input is AssertionScope {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new TypeError('Assertion scope must be an object')
  }

  const scope = input as Record<string, unknown>
  const keys = Object.keys(scope)
  if (keys.length === 0) throw new TypeError('Assertion scope must contain at least one dimension')

  for (const key of keys) {
    if (!(ASSERTION_SCOPE_FIELDS as readonly string[]).includes(key)) {
      throw new TypeError(`Unknown universal assertion scope dimension: ${JSON.stringify(key)}`)
    }
    assertCanonicalId(scope[key])
  }
}

export function isAssertionScope(input: unknown): input is AssertionScope {
  try {
    assertAssertionScope(input)
    return true
  } catch {
    return false
  }
}

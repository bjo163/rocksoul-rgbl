export const CANONICAL_ID_PREFIX = 'mw' as const
export const CANONICAL_ID_MAX_LENGTH = 255

export const CANONICAL_ID_PATTERN_SOURCE =
  '^mw:[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*:[a-z0-9]+(?:[._-][a-z0-9]+)*(?::[a-z0-9]+(?:[._-][a-z0-9]+)*)*$'

export const CANONICAL_ID_PATTERN = new RegExp(CANONICAL_ID_PATTERN_SOURCE)

const KIND_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/
const SEGMENT_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/

/**
 * A syntactically canonical MoonWitness corpus identifier.
 *
 * Runtime validation is authoritative; this template-literal type intentionally
 * remains assignment-compatible with the existing public API.
 */
export type CanonicalId = `mw:${string}`

export interface ParsedCanonicalId {
  prefix: typeof CANONICAL_ID_PREFIX
  kind: string
  segments: string[]
}

export function isCanonicalId(value: unknown): value is CanonicalId {
  return (
    typeof value === 'string' &&
    value.length <= CANONICAL_ID_MAX_LENGTH &&
    CANONICAL_ID_PATTERN.test(value)
  )
}

export function assertCanonicalId(value: unknown): asserts value is CanonicalId {
  if (!isCanonicalId(value)) {
    throw new TypeError(
      `Invalid canonical ID: expected lowercase ASCII '${CANONICAL_ID_PREFIX}:<kind>:<segment>[:<segment>...]' with a maximum length of ${CANONICAL_ID_MAX_LENGTH}`
    )
  }
}

export function parseCanonicalId(value: string): ParsedCanonicalId {
  assertCanonicalId(value)
  const [, kind, ...segments] = value.split(':')
  return { prefix: CANONICAL_ID_PREFIX, kind, segments }
}

export function formatCanonicalId(kind: string, ...segments: string[]): CanonicalId {
  if (!KIND_PATTERN.test(kind)) {
    throw new TypeError(`Invalid canonical ID kind segment: ${JSON.stringify(kind)}`)
  }
  if (segments.length === 0) {
    throw new TypeError('Canonical ID requires at least one identity segment')
  }
  for (const segment of segments) {
    if (!SEGMENT_PATTERN.test(segment)) {
      throw new TypeError(`Invalid canonical ID segment: ${JSON.stringify(segment)}`)
    }
  }

  const value = `${CANONICAL_ID_PREFIX}:${kind}:${segments.join(':')}`
  assertCanonicalId(value)
  return value
}

function normalizeCandidate(input: string): string {
  return input.normalize('NFKC').trim().toLowerCase().replace(/[\t\n\f\r ]+/g, '-')
}

/**
 * Normalize a human-curated candidate identity segment before minting an ID.
 * This is not an identity-reconciliation function and does not transliterate.
 */
export function normalizeCanonicalIdSegment(input: string): string {
  const normalized = normalizeCandidate(input)
  if (!SEGMENT_PATTERN.test(normalized)) {
    throw new TypeError(`Cannot safely normalize canonical ID segment: ${JSON.stringify(input)}`)
  }
  return normalized
}

/** Normalize a human-curated candidate kind namespace before minting an ID. */
export function normalizeCanonicalIdKind(input: string): string {
  const normalized = normalizeCandidate(input)
  if (!KIND_PATTERN.test(normalized)) {
    throw new TypeError(`Cannot safely normalize canonical ID kind: ${JSON.stringify(input)}`)
  }
  return normalized
}

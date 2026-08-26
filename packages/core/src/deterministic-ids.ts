import {
  assertCanonicalId,
  formatCanonicalId,
  parseCanonicalId,
  type CanonicalId
} from './identifiers.js'

export const DETERMINISTIC_ID_RECIPE_VERSION = 'v1' as const
export const DETERMINISTIC_ID_HASH_ALGORITHM = 'sha256' as const
export const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/

export interface ParsedDeterministicId {
  kind: string
  recipeVersion: typeof DETERMINISTIC_ID_RECIPE_VERSION
  algorithm: typeof DETERMINISTIC_ID_HASH_ALGORITHM
  digest: string
}

export type AssertionIdentityObject =
  | { entity: CanonicalId }
  | {
      value: string | number | boolean | null
      datatype?: string
      language?: string
    }

export interface AssertionIdentityInput {
  subject: CanonicalId
  predicate: CanonicalId
  object: AssertionIdentityObject
  assertion_class: string
  scope?: Readonly<Record<string, CanonicalId | string>>

  /** Non-identity metadata intentionally ignored by the v1 recipe. */
  id?: CanonicalId
  record_type?: 'assertion'
  evidence?: readonly CanonicalId[]
  provenance?: CanonicalId
  extensions?: Readonly<Record<string, unknown>>
}

export interface EvidenceIdentityInput {
  target: CanonicalId
  relation: string
  selector?: Readonly<Record<string, unknown>>

  /** Non-identity metadata intentionally ignored by the v1 recipe. */
  id?: CanonicalId
  record_type?: 'evidence'
  provenance?: CanonicalId
  extensions?: Readonly<Record<string, unknown>>
}

function encodedPrimitive(value: string | number): string {
  const encoded = JSON.stringify(value)
  if (encoded === undefined) {
    throw new TypeError('Value cannot be represented as canonical JSON')
  }
  return encoded
}

function canonicalize(value: unknown, stack: Set<object>): string {
  if (value === null) return 'null'

  if (typeof value === 'string') return encodedPrimitive(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical deterministic JSON rejects non-finite numbers')
    }
    return encodedPrimitive(value)
  }

  if (Array.isArray(value)) {
    if (stack.has(value)) {
      throw new TypeError('Canonical deterministic JSON rejects cyclic structures')
    }

    stack.add(value)
    try {
      const encoded: string[] = []
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) {
          throw new TypeError('Canonical deterministic JSON rejects sparse arrays')
        }
        encoded.push(canonicalize(value[index], stack))
      }
      return `[${encoded.join(',')}]`
    } finally {
      stack.delete(value)
    }
  }

  if (typeof value === 'object') {
    const object = value as Record<string, unknown>
    const prototype = Object.getPrototypeOf(object)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Canonical deterministic JSON accepts only plain objects')
    }
    if (Object.getOwnPropertySymbols(object).length > 0) {
      throw new TypeError('Canonical deterministic JSON rejects symbol keys')
    }
    if (stack.has(object)) {
      throw new TypeError('Canonical deterministic JSON rejects cyclic structures')
    }

    stack.add(object)
    try {
      const entries = Object.entries(object).sort(([left], [right]) =>
        left < right ? -1 : left > right ? 1 : 0
      )
      return `{${entries
        .map(([key, entryValue]) => `${encodedPrimitive(key)}:${canonicalize(entryValue, stack)}`)
        .join(',')}}`
    } finally {
      stack.delete(object)
    }
  }

  throw new TypeError(`Unsupported deterministic JSON value type: ${typeof value}`)
}

/**
 * Serialize a JSON-compatible identity payload deterministically.
 *
 * - object keys are sorted lexicographically;
 * - array order is preserved;
 * - undefined, bigint, symbols, functions, non-finite numbers, sparse arrays,
 *   non-plain objects, and cycles are rejected instead of being silently changed;
 * - strings are hashed exactly as supplied; no identity reconciliation or Unicode
 *   normalization occurs here.
 */
export function canonicalizeDeterministicJson(value: unknown): string {
  return canonicalize(value, new Set<object>())
}

export async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('SHA-256 deterministic IDs require Web Crypto SubtleCrypto support')
  }

  const bytes = new TextEncoder().encode(value)
  const digest = await subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Mint a v1 deterministic ID from an already-defined identity payload.
 * Future generated record families may reuse this primitive only after defining
 * their own normative identity payload.
 */
export async function deterministicCanonicalId(kind: string, payload: unknown): Promise<CanonicalId> {
  const canonicalPayload = canonicalizeDeterministicJson(payload)
  const digest = await sha256Hex(canonicalPayload)
  return formatCanonicalId(
    kind,
    DETERMINISTIC_ID_RECIPE_VERSION,
    DETERMINISTIC_ID_HASH_ALGORITHM,
    digest
  )
}

function assertionObjectIdentityPayload(object: AssertionIdentityObject): Record<string, unknown> {
  const raw = object as Record<string, unknown>
  const hasEntity = Object.prototype.hasOwnProperty.call(raw, 'entity')
  const hasValue = Object.prototype.hasOwnProperty.call(raw, 'value')

  if (hasEntity === hasValue) {
    throw new TypeError('Assertion identity object must contain exactly one of entity or value')
  }

  if (hasEntity) {
    assertCanonicalId(raw.entity)
    return { entity: raw.entity }
  }

  const literal = object as Exclude<AssertionIdentityObject, { entity: CanonicalId }>
  const payload: Record<string, unknown> = { value: literal.value }

  if (literal.datatype !== undefined) {
    if (typeof literal.datatype !== 'string') {
      throw new TypeError('Assertion literal datatype must be a string when present')
    }
    payload.datatype = literal.datatype
  }

  if (literal.language !== undefined) {
    if (typeof literal.language !== 'string') {
      throw new TypeError('Assertion literal language must be a string when present')
    }
    payload.language = literal.language
  }

  return payload
}

/** Build the exact semantic identity payload hashed by assertion recipe v1. */
export function assertionIdentityPayload(input: AssertionIdentityInput): Record<string, unknown> {
  assertCanonicalId(input.subject)
  assertCanonicalId(input.predicate)

  if (typeof input.assertion_class !== 'string') {
    throw new TypeError('Assertion class must be a string')
  }

  const payload: Record<string, unknown> = {
    assertion_class: input.assertion_class,
    object: assertionObjectIdentityPayload(input.object),
    predicate: input.predicate,
    record_type: 'assertion',
    subject: input.subject
  }

  if (input.scope !== undefined && Object.keys(input.scope).length > 0) {
    const scope: Record<string, string> = {}
    for (const [key, value] of Object.entries(input.scope)) {
      if (typeof value !== 'string') {
        throw new TypeError(`Assertion scope value for ${JSON.stringify(key)} must be a string`)
      }
      scope[key] = value
    }
    payload.scope = scope
  }

  return payload
}

/** Build the exact semantic identity payload hashed by evidence recipe v1. */
export function evidenceIdentityPayload(input: EvidenceIdentityInput): Record<string, unknown> {
  assertCanonicalId(input.target)
  if (typeof input.relation !== 'string') {
    throw new TypeError('Evidence relation must be a string')
  }

  const payload: Record<string, unknown> = {
    record_type: 'evidence',
    relation: input.relation,
    target: input.target
  }

  if (input.selector !== undefined) {
    if (input.selector === null || Array.isArray(input.selector) || typeof input.selector !== 'object') {
      throw new TypeError('Evidence selector must be a plain JSON object when present')
    }
    // canonicalizeDeterministicJson performs the full JSON-safety check.
    canonicalizeDeterministicJson(input.selector)
    payload.selector = input.selector
  }

  return payload
}

export async function deterministicAssertionId(input: AssertionIdentityInput): Promise<CanonicalId> {
  return deterministicCanonicalId('assertion', assertionIdentityPayload(input))
}

export async function deterministicEvidenceId(input: EvidenceIdentityInput): Promise<CanonicalId> {
  return deterministicCanonicalId('evidence', evidenceIdentityPayload(input))
}

export function parseDeterministicId(value: string): ParsedDeterministicId {
  const parsed = parseCanonicalId(value)
  const [recipeVersion, algorithm, digest] = parsed.segments

  if (
    parsed.segments.length !== 3 ||
    recipeVersion !== DETERMINISTIC_ID_RECIPE_VERSION ||
    algorithm !== DETERMINISTIC_ID_HASH_ALGORITHM ||
    !SHA256_HEX_PATTERN.test(digest)
  ) {
    throw new TypeError(
      "Invalid deterministic ID: expected 'mw:<kind>:v1:sha256:<64 lowercase hex characters>'"
    )
  }

  return {
    kind: parsed.kind,
    recipeVersion,
    algorithm,
    digest
  }
}

export function isDeterministicId(value: unknown): value is CanonicalId {
  if (typeof value !== 'string') return false
  try {
    parseDeterministicId(value)
    return true
  } catch {
    return false
  }
}

export async function verifyDeterministicId(value: string, payload: unknown): Promise<boolean> {
  let parsed: ParsedDeterministicId
  try {
    parsed = parseDeterministicId(value)
  } catch {
    return false
  }

  return (await deterministicCanonicalId(parsed.kind, payload)) === value
}

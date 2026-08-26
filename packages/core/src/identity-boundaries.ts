import { assertCanonicalId, type CanonicalId } from './identifiers.js'

export const EXTERNAL_IDENTIFIER_SCHEME_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/
export const ABSOLUTE_URI_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/

export interface ExternalIdentifier {
  /** Corpus-controlled name for the external authority/scheme, e.g. wikidata, viaf, doi. */
  scheme: string
  /** Exact identifier value as published by the external authority. */
  value: string
  /** Optional resolver/identifier URI supplied or derived for that authority. */
  uri?: string
}

export interface SourceLocalIdentifier {
  /** Canonical corpus reference to the source/resource context that owns this local identifier. */
  source: CanonicalId
  /** Exact identifier value in the source's own identifier space. */
  value: string
  /** Optional source-defined sub-namespace when one source exposes several identifier spaces. */
  namespace?: string
}

function assertIdentifierValue(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new TypeError(`${field} must not contain control characters`)
  }
}

export function normalizeExternalIdentifierScheme(input: string): string {
  const normalized = input.trim().toLowerCase()
  if (!EXTERNAL_IDENTIFIER_SCHEME_PATTERN.test(normalized)) {
    throw new TypeError(`Invalid external identifier scheme: ${JSON.stringify(input)}`)
  }
  return normalized
}

export function assertExternalIdentifier(input: unknown): asserts input is ExternalIdentifier {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new TypeError('External identifier must be an object')
  }

  const identifier = input as Record<string, unknown>
  if (typeof identifier.scheme !== 'string' || !EXTERNAL_IDENTIFIER_SCHEME_PATTERN.test(identifier.scheme)) {
    throw new TypeError('External identifier scheme must use canonical lowercase ASCII scheme syntax')
  }

  assertIdentifierValue(identifier.value, 'External identifier value')

  if (identifier.uri !== undefined) {
    assertIdentifierValue(identifier.uri, 'External identifier URI')
    if (!ABSOLUTE_URI_PATTERN.test(identifier.uri)) {
      throw new TypeError('External identifier URI must be absolute')
    }
  }
}

export function isExternalIdentifier(input: unknown): input is ExternalIdentifier {
  try {
    assertExternalIdentifier(input)
    return true
  } catch {
    return false
  }
}

export function assertSourceLocalIdentifier(input: unknown): asserts input is SourceLocalIdentifier {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new TypeError('Source-local identifier must be an object')
  }

  const identifier = input as Record<string, unknown>
  assertCanonicalId(identifier.source)
  assertIdentifierValue(identifier.value, 'Source-local identifier value')

  if (identifier.namespace !== undefined) {
    assertIdentifierValue(identifier.namespace, 'Source-local identifier namespace')
  }
}

export function isSourceLocalIdentifier(input: unknown): input is SourceLocalIdentifier {
  try {
    assertSourceLocalIdentifier(input)
    return true
  } catch {
    return false
  }
}

/** External identifier equality is exact authority + exact authority value. URI is metadata. */
export function sameExternalIdentifier(left: ExternalIdentifier, right: ExternalIdentifier): boolean {
  assertExternalIdentifier(left)
  assertExternalIdentifier(right)
  return left.scheme === right.scheme && left.value === right.value
}

/** Source-local identifier equality is exact source context + namespace + exact local value. */
export function sameSourceLocalIdentifier(
  left: SourceLocalIdentifier,
  right: SourceLocalIdentifier
): boolean {
  assertSourceLocalIdentifier(left)
  assertSourceLocalIdentifier(right)
  return (
    left.source === right.source &&
    (left.namespace ?? null) === (right.namespace ?? null) &&
    left.value === right.value
  )
}

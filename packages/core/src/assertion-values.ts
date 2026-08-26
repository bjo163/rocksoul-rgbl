import { assertCanonicalId, type CanonicalId } from './identifiers.js'

export const ASSERTION_LITERAL_LANGUAGE_PATTERN = /^[a-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/

export interface AssertionEntityValue {
  entity: CanonicalId
}

export interface AssertionLiteralValue {
  value: string | number | boolean | null
  /** Method/vocabulary-defined datatype token or absolute datatype URI. */
  datatype?: string
  /** BCP 47 language tag. Valid only when value is a string. */
  language?: string
}

export type AssertionObject = AssertionEntityValue | AssertionLiteralValue

function assertOnlyKeys(object: Record<string, unknown>, allowed: readonly string[], name: string): void {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) throw new TypeError(`${name} does not allow property ${JSON.stringify(key)}`)
  }
}

export function assertAssertionObject(input: unknown): asserts input is AssertionObject {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new TypeError('Assertion object must be an object envelope')
  }

  const object = input as Record<string, unknown>
  const hasEntity = Object.prototype.hasOwnProperty.call(object, 'entity')
  const hasValue = Object.prototype.hasOwnProperty.call(object, 'value')

  if (hasEntity === hasValue) {
    throw new TypeError('Assertion object must contain exactly one of entity or value')
  }

  if (hasEntity) {
    assertOnlyKeys(object, ['entity'], 'Assertion entity envelope')
    assertCanonicalId(object.entity)
    return
  }

  assertOnlyKeys(object, ['value', 'datatype', 'language'], 'Assertion literal envelope')
  const value = object.value
  if (!(value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
    throw new TypeError('Assertion literal value must be string, number, boolean, or null')
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('Assertion literal numbers must be finite')
  }

  if (object.datatype !== undefined) {
    if (typeof object.datatype !== 'string' || object.datatype.trim().length === 0) {
      throw new TypeError('Assertion literal datatype must be a non-blank string when present')
    }
  }

  if (object.language !== undefined) {
    if (typeof value !== 'string') {
      throw new TypeError('Assertion literal language is valid only for string values')
    }
    if (typeof object.language !== 'string' || !ASSERTION_LITERAL_LANGUAGE_PATTERN.test(object.language)) {
      throw new TypeError('Assertion literal language must be a BCP 47-style language tag')
    }
  }
}

export function isAssertionObject(input: unknown): input is AssertionObject {
  try { assertAssertionObject(input); return true } catch { return false }
}

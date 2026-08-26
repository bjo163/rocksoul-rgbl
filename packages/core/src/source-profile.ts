import type { CanonicalId } from './identifiers.js'
import type { ExternalIdentifier } from './identity-boundaries.js'

export const SOURCE_PROFILE_ID = 'source@0.1' as const

export type ArtifactAvailability = 'bundled' | 'external' | 'metadata_only' | 'restricted'
export type RightsStatus = 'public_domain' | 'licensed' | 'copyrighted' | 'unknown' | 'not_applicable'
export type RedistributionStatus = 'permitted' | 'restricted' | 'unknown'

export interface LicenseReference {
  id: `LicenseRef-${string}`
  name: string
  uri?: string
  note?: string
}

export interface RightsStatement {
  status: RightsStatus
  redistribution: RedistributionStatus
  license_expression?: string
  license_refs?: LicenseReference[]
  rights_uri?: string
  attribution?: string
  note?: string
}

export interface ArtifactDescriptor {
  availability: ArtifactAvailability
  locations?: string[]
  media_type?: string
  byte_size?: number
  sha256?: string
  retrieved_at?: string
}

export interface SourceMetadata {
  title?: string
  publisher?: CanonicalId
  institution?: CanonicalId
  revision?: string
  canonical_url?: string
  identifiers?: ExternalIdentifier[]
  language?: string
  script?: string
  artifact?: CanonicalId
  provenance?: CanonicalId
  descriptor?: ArtifactDescriptor
  rights?: RightsStatement
}

export const LICENSE_REF_PATTERN = /^LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]*$/
const LICENSE_ID_PATTERN = /^(?:[A-Za-z0-9][A-Za-z0-9.-]*\+?|LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]*)$/
const RESERVED_LICENSE_TOKENS = new Set(['AND', 'OR', 'WITH'])

function isLicenseId(token: string | undefined): token is string {
  return Boolean(token) && !RESERVED_LICENSE_TOKENS.has(token!) && LICENSE_ID_PATTERN.test(token!)
}

interface LicenseParser {
  tokens: string[]
  index: number
}

function tokenizeLicenseExpression(input: string): string[] | null {
  const tokens: string[] = []
  let index = 0
  while (index < input.length) {
    if (/\s/.test(input[index])) {
      index += 1
      continue
    }
    if (input[index] === '(' || input[index] === ')') {
      tokens.push(input[index])
      index += 1
      continue
    }
    const match = input.slice(index).match(/^[A-Za-z0-9][A-Za-z0-9.+-]*/)
    if (!match) return null
    tokens.push(match[0])
    index += match[0].length
  }
  return tokens
}

function parseAtom(parser: LicenseParser): boolean {
  const token = parser.tokens[parser.index]
  if (token === '(') {
    parser.index += 1
    if (!parseOr(parser) || parser.tokens[parser.index] !== ')') return false
    parser.index += 1
    return true
  }
  if (!isLicenseId(token)) return false
  parser.index += 1
  if (parser.tokens[parser.index] === 'WITH') {
    parser.index += 1
    const exception = parser.tokens[parser.index]
    if (!isLicenseId(exception) || exception.startsWith('LicenseRef-')) return false
    parser.index += 1
  }
  return true
}

function parseAnd(parser: LicenseParser): boolean {
  if (!parseAtom(parser)) return false
  while (parser.tokens[parser.index] === 'AND') {
    parser.index += 1
    if (!parseAtom(parser)) return false
  }
  return true
}

function parseOr(parser: LicenseParser): boolean {
  if (!parseAnd(parser)) return false
  while (parser.tokens[parser.index] === 'OR') {
    parser.index += 1
    if (!parseAnd(parser)) return false
  }
  return true
}

export function isSpdxCompatibleLicenseExpression(input: unknown): input is string {
  if (typeof input !== 'string' || input.trim() !== input || input.length === 0) return false
  const tokens = tokenizeLicenseExpression(input)
  if (!tokens || tokens.length === 0) return false
  const parser: LicenseParser = { tokens, index: 0 }
  return parseOr(parser) && parser.index === tokens.length
}

export function licenseRefsInExpression(input: string): string[] {
  const tokens = tokenizeLicenseExpression(input) ?? []
  return Array.from(new Set(tokens.filter((token) => LICENSE_REF_PATTERN.test(token))))
}

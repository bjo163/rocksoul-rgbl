import {
  deterministicAssertionId,
  deterministicEvidenceId,
  isDeterministicId,
  parseCanonicalId,
  type AssertionIdentityInput,
  type EvidenceIdentityInput
} from '@moonwitness/corpus-core'

export interface SemanticInvariantFinding {
  code: string
  message: string
}

const FIXED_ID_KIND_BY_RECORD_TYPE: Readonly<Record<string, string>> = {
  assertion: 'assertion',
  evidence: 'evidence',
  provenance: 'provenance',
  assessment: 'assessment'
}

function requireNonBlank(
  findings: SemanticInvariantFinding[],
  record: Record<string, unknown>,
  field: string,
  code: string
): void {
  const value = record[field]
  if (typeof value === 'string' && value.trim().length === 0) {
    findings.push({ code, message: `${field} must contain a non-whitespace semantic value` })
  }
}

function looksLikeDeterministicV1Id(id: string): boolean {
  try {
    const parsed = parseCanonicalId(id)
    return parsed.segments[0] === 'v1' && parsed.segments[1] === 'sha256'
  } catch {
    return false
  }
}

/**
 * Validate cross-field/core semantic invariants that intentionally live above
 * JSON Schema. Call this only after the record has passed its structural schema.
 */
export async function validateSemanticInvariants(
  record: Record<string, unknown>
): Promise<SemanticInvariantFinding[]> {
  const findings: SemanticInvariantFinding[] = []
  const recordType = record.record_type
  const id = record.id

  if (typeof recordType !== 'string' || typeof id !== 'string') return findings

  const fixedKind = FIXED_ID_KIND_BY_RECORD_TYPE[recordType]
  if (fixedKind) {
    const parsed = parseCanonicalId(id)
    if (parsed.kind !== fixedKind) {
      findings.push({
        code: 'record-family-id-kind',
        message: `${recordType} records must use canonical ID kind '${fixedKind}', not '${parsed.kind}'`
      })
    }
  }

  switch (recordType) {
    case 'entity':
    case 'resource':
      requireNonBlank(findings, record, 'kind', 'nonblank-kind')
      break
    case 'assertion':
      requireNonBlank(findings, record, 'assertion_class', 'nonblank-assertion-class')
      break
    case 'evidence':
      requireNonBlank(findings, record, 'relation', 'nonblank-evidence-relation')
      break
    case 'assessment':
      requireNonBlank(findings, record, 'result', 'nonblank-assessment-result')
      break
  }

  if (record.lifecycle && typeof record.lifecycle === 'object' && !Array.isArray(record.lifecycle)) {
    const replacements = (record.lifecycle as Record<string, unknown>).replacements
    if (Array.isArray(replacements) && replacements.includes(id)) {
      findings.push({
        code: 'lifecycle-self-replacement',
        message: 'A record must not name its own canonical ID as a lifecycle replacement'
      })
    }
  }

  if ((recordType === 'assertion' || recordType === 'evidence') && looksLikeDeterministicV1Id(id)) {
    if (!isDeterministicId(id)) {
      findings.push({
        code: 'malformed-deterministic-id',
        message: `Deterministic ${recordType} ID must use mw:${recordType}:v1:sha256:<64 lowercase hex>`
      })
      return findings
    }

    const expected =
      recordType === 'assertion'
        ? await deterministicAssertionId(record as unknown as AssertionIdentityInput)
        : await deterministicEvidenceId(record as unknown as EvidenceIdentityInput)

    if (expected !== id) {
      findings.push({
        code: 'deterministic-id-mismatch',
        message: `Deterministic ${recordType} ID does not match its v1 semantic identity payload; expected ${expected}`
      })
    }
  }

  return findings
}

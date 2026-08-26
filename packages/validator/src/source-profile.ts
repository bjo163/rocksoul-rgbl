import {
  isSpdxCompatibleLicenseExpression,
  licenseRefsInExpression,
  type RightsStatement
} from '@moonwitness/corpus-core'

export const SOURCE_PROFILE_ID = 'source@0.1' as const

export interface SourceInvariantFinding {
  code: string
  message: string
}

export interface SourceRecordSnapshot {
  record: Record<string, unknown>
  datasetId: string
  file: string
  line: number
}

export interface SourceReferenceUse {
  id: string
  field: string
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export function sourceMetadata(record: Record<string, unknown>): Record<string, unknown> | undefined {
  return object(object(record.extensions)?.source)
}

function pushString(references: SourceReferenceUse[], field: string, value: unknown): void {
  if (typeof value === 'string') references.push({ id: value, field })
}

export function extractSourceReferences(record: Record<string, unknown>): SourceReferenceUse[] {
  const source = sourceMetadata(record)
  if (!source) return []
  const references: SourceReferenceUse[] = []
  pushString(references, 'extensions.source.publisher', source.publisher)
  pushString(references, 'extensions.source.institution', source.institution)
  pushString(references, 'extensions.source.artifact', source.artifact)
  pushString(references, 'extensions.source.provenance', source.provenance)
  return references
}

export function extractProvenanceActivityReferences(record: Record<string, unknown>): SourceReferenceUse[] {
  if (record.record_type !== 'provenance' || !Array.isArray(record.activities)) return []
  const references: SourceReferenceUse[] = []
  record.activities.forEach((activity, index) =>
    pushString(references, `activities[${index}].agent`, object(activity)?.agent)
  )
  return references
}

function recordTypeOf(recordById: Map<string, Record<string, unknown>>, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined
  const target = recordById.get(id)
  return typeof target?.record_type === 'string' ? target.record_type : undefined
}

function kindOf(recordById: Map<string, Record<string, unknown>>, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined
  const target = recordById.get(id)
  return target?.record_type === 'resource' && typeof target.kind === 'string' ? target.kind : undefined
}

function requireRecordType(
  findings: SourceInvariantFinding[],
  recordById: Map<string, Record<string, unknown>>,
  field: string,
  id: unknown,
  expected: string
): void {
  if (typeof id !== 'string') return
  const actual = recordTypeOf(recordById, id)
  if (actual && actual !== expected) {
    findings.push({ code: 'source-reference-record-type', message: `${field} must reference a ${expected} record, not ${actual}` })
  }
}

function validateRights(findings: SourceInvariantFinding[], rightsValue: unknown): void {
  const rights = object(rightsValue) as RightsStatement | undefined
  if (!rights) return

  if (Array.isArray(rights.license_refs)) {
    const seen = new Set<string>()
    for (const reference of rights.license_refs) {
      if (seen.has(reference.id)) {
        findings.push({ code: 'duplicate-license-ref', message: `rights.license_refs defines ${reference.id} more than once` })
      }
      seen.add(reference.id)
    }
  }

  if (rights.license_expression !== undefined) {
    if (!isSpdxCompatibleLicenseExpression(rights.license_expression)) {
      findings.push({ code: 'invalid-license-expression', message: 'rights.license_expression must use SPDX-compatible expression syntax' })
    } else {
      const defined = new Set(
        Array.isArray(rights.license_refs)
          ? rights.license_refs.map((reference) => reference.id)
          : []
      )
      for (const id of licenseRefsInExpression(rights.license_expression)) {
        if (!defined.has(id as `LicenseRef-${string}`)) {
          findings.push({ code: 'undefined-license-ref', message: `License expression references ${id}, but rights.license_refs does not define it` })
        }
      }
    }
  }

  if (rights.status === 'licensed' && !rights.license_expression) {
    findings.push({ code: 'licensed-without-expression', message: "rights.status 'licensed' requires rights.license_expression" })
  }
}

export function validateSourceRecordInvariants(
  record: Record<string, unknown>,
  recordById: Map<string, Record<string, unknown>>
): SourceInvariantFinding[] {
  const findings: SourceInvariantFinding[] = []
  const source = sourceMetadata(record)
  if (!source) return findings

  requireRecordType(findings, recordById, 'extensions.source.publisher', source.publisher, 'entity')
  requireRecordType(findings, recordById, 'extensions.source.institution', source.institution, 'entity')
  requireRecordType(findings, recordById, 'extensions.source.provenance', source.provenance, 'provenance')

  if (typeof source.artifact === 'string') {
    const kind = kindOf(recordById, source.artifact)
    if (kind && kind !== 'textual.artifact') {
      findings.push({ code: 'source-artifact-reference-kind', message: `extensions.source.artifact must reference textual.artifact, not ${kind}` })
    }
  }

  validateRights(findings, source.rights)

  const descriptor = object(source.descriptor)
  const availability = descriptor?.availability
  if (availability === 'bundled') {
    if (typeof descriptor?.sha256 !== 'string') {
      findings.push({ code: 'bundled-artifact-missing-sha256', message: 'Bundled artifact descriptor must declare SHA-256 of the pinned bytes' })
    }
    if (typeof descriptor?.byte_size !== 'number') {
      findings.push({ code: 'bundled-artifact-missing-byte-size', message: 'Bundled artifact descriptor must declare byte_size' })
    }
    const rights = object(source.rights)
    if (!rights) {
      findings.push({ code: 'bundled-artifact-missing-rights', message: 'Bundled artifact descriptor must declare source rights metadata' })
    } else {
      if (rights.redistribution !== 'permitted') {
        findings.push({ code: 'bundled-artifact-redistribution-not-permitted', message: "Bundled artifact rights.redistribution must be 'permitted'" })
      }
      if (rights.status === 'unknown' || rights.status === 'copyrighted') {
        findings.push({ code: 'bundled-artifact-rights-unsafe', message: `Bundled artifact rights.status '${String(rights.status)}' does not establish redistribution permission` })
      }
    }
  }

  if (availability === 'external' && !Array.isArray(descriptor?.locations)) {
    findings.push({ code: 'external-artifact-missing-location', message: 'External artifact descriptor must declare at least one location' })
  }

  if (record.record_type === 'resource' && record.kind === 'textual.content') {
    if (typeof source.artifact !== 'string') {
      findings.push({ code: 'content-missing-source-artifact', message: 'Source-profile textual content must reference its exact source artifact' })
    }
    if (typeof source.provenance !== 'string') {
      findings.push({ code: 'content-missing-provenance', message: 'Source-profile textual content must reference provenance describing its processing path' })
    }
  }

  if (record.record_type === 'resource' && record.kind === 'textual.artifact' && !descriptor) {
    findings.push({ code: 'artifact-missing-descriptor', message: 'Source-profile textual artifact must declare extensions.source.descriptor' })
  }

  return findings
}

export function validateProvenanceRecordInvariants(
  record: Record<string, unknown>,
  recordById: Map<string, Record<string, unknown>>
): SourceInvariantFinding[] {
  const findings: SourceInvariantFinding[] = []
  if (record.record_type !== 'provenance') return findings

  requireRecordType(findings, recordById, 'source', record.source, 'resource')

  if (Array.isArray(record.activities)) {
    record.activities.forEach((activityValue, index) => {
      const activity = object(activityValue)
      if (!activity) return
      requireRecordType(findings, recordById, `activities[${index}].agent`, activity.agent, 'entity')
      if (typeof activity.started_at === 'string' && typeof activity.ended_at === 'string') {
        const start = Date.parse(activity.started_at)
        const end = Date.parse(activity.ended_at)
        if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
          findings.push({ code: 'provenance-activity-time-order', message: `activities[${index}].ended_at must not precede started_at` })
        }
      }
    })
  }
  return findings
}

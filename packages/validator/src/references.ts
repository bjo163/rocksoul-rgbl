export interface CanonicalReferenceUse {
  id: string
  field: string
}

const ASSERTION_SCOPE_FIELDS = ['tradition', 'community', 'agent', 'period', 'place'] as const

function pushString(references: CanonicalReferenceUse[], field: string, value: unknown): void {
  if (typeof value === 'string') references.push({ id: value, field })
}

function pushArray(references: CanonicalReferenceUse[], field: string, value: unknown): void {
  if (!Array.isArray(value)) return
  for (let index = 0; index < value.length; index += 1) pushString(references, `${field}[${index}]`, value[index])
}

export function extractCanonicalReferences(record: Record<string, unknown>): CanonicalReferenceUse[] {
  const references: CanonicalReferenceUse[] = []
  switch (record.record_type) {
    case 'assertion': {
      pushString(references, 'subject', record.subject)
      pushString(references, 'predicate', record.predicate)
      if (record.object && typeof record.object === 'object' && !Array.isArray(record.object)) {
        pushString(references, 'object.entity', (record.object as Record<string, unknown>).entity)
      }
      if (record.scope && typeof record.scope === 'object' && !Array.isArray(record.scope)) {
        const scope = record.scope as Record<string, unknown>
        for (const field of ASSERTION_SCOPE_FIELDS) pushString(references, `scope.${field}`, scope[field])
      }
      pushArray(references, 'evidence', record.evidence)
      pushString(references, 'provenance', record.provenance)
      break
    }
    case 'evidence':
      pushString(references, 'target', record.target)
      pushString(references, 'provenance', record.provenance)
      break
    case 'provenance':
      pushString(references, 'source', record.source)
      break
    case 'assessment':
      pushString(references, 'target', record.target)
      pushString(references, 'assessor', record.assessor)
      pushArray(references, 'evidence', record.evidence)
      break
  }
  if (record.lifecycle && typeof record.lifecycle === 'object' && !Array.isArray(record.lifecycle)) {
    pushArray(references, 'lifecycle.replacements', (record.lifecycle as Record<string, unknown>).replacements)
  }
  return references
}

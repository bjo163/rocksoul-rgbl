export interface CanonicalReferenceUse {
  id: string
  field: string
}

function pushString(
  references: CanonicalReferenceUse[],
  field: string,
  value: unknown,
  canonicalLookingOnly = false
): void {
  if (typeof value !== 'string') return
  if (canonicalLookingOnly && !value.startsWith('mw:')) return
  references.push({ id: value, field })
}

function pushArray(references: CanonicalReferenceUse[], field: string, value: unknown): void {
  if (!Array.isArray(value)) return
  for (let index = 0; index < value.length; index += 1) {
    pushString(references, `${field}[${index}]`, value[index])
  }
}

/**
 * Extract only universal core canonical-reference fields.
 * Extension/profile payloads are deliberately ignored until their own schemas
 * define reference semantics.
 */
export function extractCanonicalReferences(record: Record<string, unknown>): CanonicalReferenceUse[] {
  const references: CanonicalReferenceUse[] = []

  switch (record.record_type) {
    case 'assertion': {
      pushString(references, 'subject', record.subject)
      pushString(references, 'predicate', record.predicate)

      if (record.object && typeof record.object === 'object' && !Array.isArray(record.object)) {
        const object = record.object as Record<string, unknown>
        pushString(references, 'object.entity', object.entity)
      }

      if (record.scope && typeof record.scope === 'object' && !Array.isArray(record.scope)) {
        for (const [key, value] of Object.entries(record.scope as Record<string, unknown>)) {
          pushString(references, `scope.${key}`, value, true)
        }
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

    default:
      break
  }

  return references
}

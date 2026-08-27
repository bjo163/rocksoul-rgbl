import { parseCanonicalId } from '@moonwitness/corpus-core'

export const TEXTUAL_PROFILE_ID = 'textual@0.1' as const

export const TEXTUAL_SCHEMA_FILE_BY_KIND: Readonly<Record<string, string>> = {
  'textual.work': 'work.schema.json',
  'textual.expression': 'expression.schema.json',
  'textual.edition': 'edition.schema.json',
  'textual.artifact': 'artifact.schema.json',
  'textual.passage': 'passage.schema.json',
  'textual.citation_scheme': 'citation-scheme.schema.json',
  'textual.book_set': 'book-set.schema.json',
  'textual.fragment': 'fragment.schema.json',
  'textual.content': 'content.schema.json',
  'textual.alignment': 'alignment.schema.json',
  'textual.variant': 'variant.schema.json'
}

export const TEXTUAL_SELECTOR_TYPES = new Set(['TextQuoteSelector', 'TextPositionSelector', 'RangeSelector'])

export interface TextualInvariantFinding {
  code: string
  message: string
}

export interface TextualRecordSnapshot {
  record: Record<string, unknown>
  datasetId: string
  file: string
  line: number
}

export interface TextualReferenceUse {
  id: string
  field: string
}

const EXPECTED_ID_KIND: Readonly<Record<string, string>> = {
  'textual.work': 'work',
  'textual.expression': 'expression',
  'textual.edition': 'edition',
  'textual.artifact': 'artifact',
  'textual.passage': 'passage',
  'textual.citation_scheme': 'citation-scheme',
  'textual.book_set': 'collection',
  'textual.fragment': 'fragment',
  'textual.content': 'content',
  'textual.alignment': 'alignment',
  'textual.variant': 'variant'
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export function textualPayload(record: Record<string, unknown>): Record<string, unknown> | undefined {
  return object(object(record.extensions)?.textual)
}

function pushString(references: TextualReferenceUse[], field: string, value: unknown): void {
  if (typeof value === 'string') references.push({ id: value, field })
}

function pushArray(references: TextualReferenceUse[], field: string, value: unknown): void {
  if (!Array.isArray(value)) return
  value.forEach((item, index) => pushString(references, `${field}[${index}]`, item))
}

function pushTargets(references: TextualReferenceUse[], field: string, value: unknown): void {
  if (!Array.isArray(value)) return
  value.forEach((item, index) => pushString(references, `${field}[${index}].target`, object(item)?.target))
}

export function extractTextualReferences(record: Record<string, unknown>): TextualReferenceUse[] {
  if (record.record_type !== 'resource' || typeof record.kind !== 'string' || !record.kind.startsWith('textual.')) return []
  const payload = textualPayload(record)
  if (!payload) return []
  const references: TextualReferenceUse[] = []

  switch (record.kind) {
    case 'textual.work':
      pushString(references, 'extensions.textual.part_of', payload.part_of)
      break
    case 'textual.expression':
      pushString(references, 'extensions.textual.work', payload.work)
      if (Array.isArray(payload.relations)) {
        payload.relations.forEach((relation, index) =>
          pushString(references, `extensions.textual.relations[${index}].expression`, object(relation)?.expression)
        )
      }
      break
    case 'textual.edition':
      pushArray(references, 'extensions.textual.expressions', payload.expressions)
      break
    case 'textual.artifact':
      pushString(references, 'extensions.textual.represents', payload.represents)
      break
    case 'textual.passage':
      pushString(references, 'extensions.textual.container', payload.container)
      pushString(references, 'extensions.textual.parent', payload.parent)
      if (Array.isArray(payload.citations)) {
        payload.citations.forEach((citation, index) =>
          pushString(references, `extensions.textual.citations[${index}].scheme`, object(citation)?.scheme)
        )
      }
      break
    case 'textual.citation_scheme':
      pushArray(references, 'extensions.textual.applies_to', payload.applies_to)
      break
    case 'textual.book_set':
      pushString(references, 'extensions.textual.edition', payload.edition)
      break
    case 'textual.fragment':
      pushString(references, 'extensions.textual.parent', payload.parent)
      pushString(references, 'extensions.textual.edition', payload.edition)
      pushString(references, 'extensions.textual.provenance', payload.provenance)
      break
    case 'textual.content':
      pushString(references, 'extensions.textual.target', payload.target)
      if (Array.isArray(payload.derived_from)) {
        payload.derived_from.forEach((derivation, index) =>
          pushString(references, `extensions.textual.derived_from[${index}].content`, object(derivation)?.content)
        )
      }
      break
    case 'textual.alignment':
      pushTargets(references, 'extensions.textual.sources', payload.sources)
      pushTargets(references, 'extensions.textual.targets', payload.targets)
      pushString(references, 'extensions.textual.provenance', payload.provenance)
      break
    case 'textual.variant':
      pushTargets(references, 'extensions.textual.locus', payload.locus)
      if (Array.isArray(payload.readings)) {
        payload.readings.forEach((reading, index) => {
          const value = object(reading)
          if (!value) return
          pushArray(references, `extensions.textual.readings[${index}].witnesses`, value.witnesses)
          pushString(references, `extensions.textual.readings[${index}].content`, value.content)
        })
      }
      pushString(references, 'extensions.textual.provenance', payload.provenance)
      break
  }

  return references
}

function kindOf(recordById: Map<string, Record<string, unknown>>, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined
  const target = recordById.get(id)
  return target?.record_type === 'resource' && typeof target.kind === 'string' ? target.kind : undefined
}

function recordTypeOf(recordById: Map<string, Record<string, unknown>>, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined
  const target = recordById.get(id)
  return typeof target?.record_type === 'string' ? target.record_type : undefined
}

function requireTargetKind(
  findings: TextualInvariantFinding[],
  recordById: Map<string, Record<string, unknown>>,
  field: string,
  id: unknown,
  allowed: readonly string[]
): void {
  if (typeof id !== 'string') return
  const target = recordById.get(id)
  if (!target) return
  const actual = kindOf(recordById, id)
  if (!actual || !allowed.includes(actual)) {
    const description = actual ?? `${String(target.record_type)} record`
    findings.push({
      code: 'textual-reference-kind',
      message: `${field} must reference ${allowed.join(' or ')}, not ${description}`
    })
  }
}

function requireRecordType(
  findings: TextualInvariantFinding[],
  recordById: Map<string, Record<string, unknown>>,
  field: string,
  id: unknown,
  expected: string
): void {
  if (typeof id !== 'string') return
  const actual = recordTypeOf(recordById, id)
  if (actual && actual !== expected) {
    findings.push({ code: 'textual-reference-record-type', message: `${field} must reference a ${expected} record, not ${actual}` })
  }
}

export function validateTextSelector(selector: unknown, field = 'selector'): TextualInvariantFinding[] {
  const findings: TextualInvariantFinding[] = []
  const value = object(selector)
  if (!value || typeof value.type !== 'string') return findings
  if (value.type === 'TextPositionSelector') {
    if (typeof value.start === 'number' && typeof value.end === 'number' && value.end < value.start) {
      findings.push({ code: 'text-position-order', message: `${field}.end must be greater than or equal to ${field}.start` })
    }
  } else if (value.type === 'RangeSelector') {
    findings.push(...validateTextSelector(value.startSelector, `${field}.startSelector`))
    findings.push(...validateTextSelector(value.endSelector, `${field}.endSelector`))
  }
  return findings
}

function validateTextTargets(findings: TextualInvariantFinding[], value: unknown, field: string): void {
  if (!Array.isArray(value)) return
  value.forEach((item, index) => findings.push(...validateTextSelector(object(item)?.selector, `${field}[${index}].selector`)))
}

export function validateTextualRecordInvariants(
  record: Record<string, unknown>,
  recordById: Map<string, Record<string, unknown>>
): TextualInvariantFinding[] {
  const findings: TextualInvariantFinding[] = []
  const kind = typeof record.kind === 'string' ? record.kind : undefined
  if (!kind || !kind.startsWith('textual.')) return findings
  const payload = textualPayload(record)
  if (!payload) return findings

  if (typeof record.id === 'string' && EXPECTED_ID_KIND[kind]) {
    const parsed = parseCanonicalId(record.id)
    if (parsed.kind !== EXPECTED_ID_KIND[kind]) {
      findings.push({
        code: 'textual-resource-id-kind',
        message: `${kind} resources must use canonical ID kind '${EXPECTED_ID_KIND[kind]}', not '${parsed.kind}'`
      })
    }
  }

  switch (kind) {
    case 'textual.work':
      requireTargetKind(findings, recordById, 'extensions.textual.part_of', payload.part_of, ['textual.work'])
      if (payload.part_of === record.id) findings.push({ code: 'work-self-part', message: 'A textual work must not be part_of itself' })
      break
    case 'textual.expression':
      requireTargetKind(findings, recordById, 'extensions.textual.work', payload.work, ['textual.work'])
      if (Array.isArray(payload.relations)) {
        payload.relations.forEach((relation, index) => {
          const target = object(relation)?.expression
          requireTargetKind(findings, recordById, `extensions.textual.relations[${index}].expression`, target, ['textual.expression'])
          if (target === record.id) findings.push({ code: 'expression-self-relation', message: 'A textual expression must not relate to itself as a source expression' })
        })
      }
      break
    case 'textual.edition':
      if (Array.isArray(payload.expressions)) {
        payload.expressions.forEach((id, index) => requireTargetKind(findings, recordById, `extensions.textual.expressions[${index}]`, id, ['textual.expression']))
      }
      break
    case 'textual.artifact':
      requireTargetKind(findings, recordById, 'extensions.textual.represents', payload.represents, ['textual.work', 'textual.expression', 'textual.edition'])
      break
    case 'textual.passage': {
      requireTargetKind(findings, recordById, 'extensions.textual.container', payload.container, ['textual.work', 'textual.expression', 'textual.edition', 'textual.artifact'])
      if (payload.parent === record.id) findings.push({ code: 'passage-self-parent', message: 'A textual passage must not be its own parent' })
      requireTargetKind(findings, recordById, 'extensions.textual.parent', payload.parent, ['textual.passage'])
      if (typeof payload.parent === 'string') {
        const parent = recordById.get(payload.parent)
        const parentPayload = parent ? textualPayload(parent) : undefined
        if (parentPayload && parentPayload.container !== payload.container) {
          findings.push({ code: 'passage-container-mismatch', message: 'A child passage and its parent must share the same container' })
        }
      }
      if (Array.isArray(payload.citations)) {
        payload.citations.forEach((citation, index) => {
          const value = object(citation)
          if (!value) return
          requireTargetKind(findings, recordById, `extensions.textual.citations[${index}].scheme`, value.scheme, ['textual.citation_scheme'])
          if (typeof value.scheme !== 'string' || !Array.isArray(value.path)) return
          const scheme = recordById.get(value.scheme)
          const schemePayload = scheme ? textualPayload(scheme) : undefined
          const components = Array.isArray(schemePayload?.components) ? schemePayload.components : undefined
          if (!components) return
          if (value.path.length > components.length) {
            findings.push({ code: 'citation-path-depth', message: `Citation path has ${value.path.length} components but scheme defines only ${components.length}` })
          } else if (value.path.length > 0 && typeof payload.unit === 'string') {
            const terminal = object(components[value.path.length - 1])
            if (typeof terminal?.unit === 'string' && terminal.unit !== payload.unit) {
              findings.push({ code: 'citation-unit-mismatch', message: `Citation path depth resolves to unit '${terminal.unit}' but passage unit is '${payload.unit}'` })
            }
          }
        })
      }
      break
    }
    case 'textual.citation_scheme':
      if (Array.isArray(payload.applies_to)) {
        payload.applies_to.forEach((id, index) => requireTargetKind(findings, recordById, `extensions.textual.applies_to[${index}]`, id, ['textual.work', 'textual.expression', 'textual.edition', 'textual.artifact']))
      }
      if (Array.isArray(payload.components)) {
        const keys = new Set<string>()
        payload.components.forEach((component) => {
          const key = object(component)?.key
          if (typeof key === 'string') {
            if (keys.has(key)) findings.push({ code: 'duplicate-citation-component-key', message: `Citation scheme component key '${key}' is duplicated` })
            keys.add(key)
          }
        })
      }
      break
    case 'textual.content':
      requireTargetKind(findings, recordById, 'extensions.textual.target', payload.target, ['textual.work', 'textual.expression', 'textual.edition', 'textual.artifact', 'textual.passage'])
      if (payload.representation === 'source' && Array.isArray(payload.derived_from)) {
        findings.push({ code: 'source-content-derived', message: "A 'source' content representation must not derive from another content record" })
      }
      if (Array.isArray(payload.derived_from)) {
        payload.derived_from.forEach((derivation, index) => {
          const source = object(derivation)?.content
          requireTargetKind(findings, recordById, `extensions.textual.derived_from[${index}].content`, source, ['textual.content'])
          if (source === record.id) findings.push({ code: 'content-self-derivation', message: 'A textual content record must not derive from itself' })
        })
      }
      break
    case 'textual.alignment':
      if (Array.isArray(payload.sources)) {
        payload.sources.forEach((target, index) => requireTargetKind(findings, recordById, `extensions.textual.sources[${index}].target`, object(target)?.target, ['textual.passage', 'textual.content']))
      }
      if (Array.isArray(payload.targets)) {
        payload.targets.forEach((target, index) => requireTargetKind(findings, recordById, `extensions.textual.targets[${index}].target`, object(target)?.target, ['textual.passage', 'textual.content']))
      }
      validateTextTargets(findings, payload.sources, 'extensions.textual.sources')
      validateTextTargets(findings, payload.targets, 'extensions.textual.targets')
      requireRecordType(findings, recordById, 'extensions.textual.provenance', payload.provenance, 'provenance')
      break
    case 'textual.variant':
      if (Array.isArray(payload.locus)) {
        payload.locus.forEach((target, index) => requireTargetKind(findings, recordById, `extensions.textual.locus[${index}].target`, object(target)?.target, ['textual.passage', 'textual.content']))
      }
      validateTextTargets(findings, payload.locus, 'extensions.textual.locus')
      if (Array.isArray(payload.readings)) {
        payload.readings.forEach((reading, readingIndex) => {
          const value = object(reading)
          if (!value) return
          if (Array.isArray(value.witnesses)) {
            value.witnesses.forEach((witness, witnessIndex) => requireTargetKind(findings, recordById, `extensions.textual.readings[${readingIndex}].witnesses[${witnessIndex}]`, witness, ['textual.expression', 'textual.edition', 'textual.artifact']))
          }
          requireTargetKind(findings, recordById, `extensions.textual.readings[${readingIndex}].content`, value.content, ['textual.content'])
          if (value.language !== undefined && value.text === undefined) {
            findings.push({ code: 'variant-language-without-text', message: `extensions.textual.readings[${readingIndex}].language is valid only for an inline text reading` })
          }
          if (value.script !== undefined && value.text === undefined) {
            findings.push({ code: 'variant-script-without-text', message: `extensions.textual.readings[${readingIndex}].script is valid only for an inline text reading` })
          }
        })
      }
      requireRecordType(findings, recordById, 'extensions.textual.provenance', payload.provenance, 'provenance')
      break
  }

  return findings
}

export function validateTextualGraphInvariants(
  snapshots: TextualRecordSnapshot[],
  allRecordsById?: Map<string, Record<string, unknown>>
): Array<TextualInvariantFinding & { snapshot: TextualRecordSnapshot }> {
  const findings: Array<TextualInvariantFinding & { snapshot: TextualRecordSnapshot }> = []
  const recordById = allRecordsById ?? new Map<string, Record<string, unknown>>()
  if (!allRecordsById) {
    for (const snapshot of snapshots) {
      if (typeof snapshot.record.id === 'string' && !recordById.has(snapshot.record.id)) recordById.set(snapshot.record.id, snapshot.record)
    }
  }

  for (const snapshot of snapshots) {
    for (const finding of validateTextualRecordInvariants(snapshot.record, recordById)) findings.push({ ...finding, snapshot })
  }

  const passageById = new Map<string, TextualRecordSnapshot>()
  const contentById = new Map<string, TextualRecordSnapshot>()
  for (const snapshot of snapshots) {
    if (typeof snapshot.record.id !== 'string') continue
    if (snapshot.record.kind === 'textual.passage') passageById.set(snapshot.record.id, snapshot)
    if (snapshot.record.kind === 'textual.content') contentById.set(snapshot.record.id, snapshot)
  }

  const sequenceOwner = new Map<string, TextualRecordSnapshot>()
  for (const snapshot of passageById.values()) {
    const payload = textualPayload(snapshot.record)
    if (!payload || typeof payload.sequence !== 'number') continue
    const scope = `${String(payload.container)}\u0000${String(payload.parent ?? '')}\u0000${payload.sequence}`
    const first = sequenceOwner.get(scope)
    if (first) {
      findings.push({
        code: 'duplicate-passage-sequence',
        message: `Passage sequence ${payload.sequence} is duplicated under the same parent/container`,
        snapshot
      })
    } else sequenceOwner.set(scope, snapshot)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  function visitPassage(id: string, origin: TextualRecordSnapshot): void {
    if (visited.has(id)) return
    if (visiting.has(id)) {
      findings.push({ code: 'passage-parent-cycle', message: `Passage parent hierarchy contains a cycle at ${id}`, snapshot: origin })
      return
    }
    visiting.add(id)
    const next = textualPayload(passageById.get(id)?.record ?? {})?.parent
    if (typeof next === 'string' && passageById.has(next)) visitPassage(next, origin)
    visiting.delete(id)
    visited.add(id)
  }
  for (const [id, snapshot] of passageById) visitPassage(id, snapshot)

  visiting.clear()
  visited.clear()
  function visitContent(id: string, origin: TextualRecordSnapshot): void {
    if (visited.has(id)) return
    if (visiting.has(id)) {
      findings.push({ code: 'content-derivation-cycle', message: `Content derivation graph contains a cycle at ${id}`, snapshot: origin })
      return
    }
    visiting.add(id)
    const derived = textualPayload(contentById.get(id)?.record ?? {})?.derived_from
    if (Array.isArray(derived)) {
      for (const item of derived) {
        const next = object(item)?.content
        if (typeof next === 'string' && contentById.has(next)) visitContent(next, origin)
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  for (const [id, snapshot] of contentById) visitContent(id, snapshot)

  return findings
}

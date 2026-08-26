import type {
  Assertion,
  CanonicalId,
  CorpusRecord,
  Entity,
  Evidence,
  Provenance,
  Resource,
  Assessment
} from '@moonwitness/corpus-core'
import { resolveDatasetDependencies as resolveDependencies } from './registry.js'
import type {
  AssertionEvidenceTraversal,
  AssertionQuery,
  AssertionScopeFilter,
  CorpusRecordQuery,
  CorpusRepository,
  CorpusSearchQuery,
  CorpusSearchResult,
  DatasetDependencyResolution,
  DatasetDescriptor,
  PassageReferenceQuery
} from './types.js'

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

function preferredLabel(record: CorpusRecord): string | undefined {
  if (!('labels' in record) || !record.labels?.length) return undefined
  return record.labels.find((label) => label.role === 'preferred')?.value ?? record.labels[0]?.value
}

function textualPayload(record: CorpusRecord): Record<string, unknown> | undefined {
  if (record.record_type !== 'resource') return undefined
  const textual = record.extensions?.textual
  return textual && typeof textual === 'object' && !Array.isArray(textual)
    ? (textual as Record<string, unknown>)
    : undefined
}

function matchesScope(assertion: Assertion, filter?: AssertionScopeFilter): boolean {
  if (!filter) return true
  const entries = Object.entries(filter) as Array<[keyof AssertionScopeFilter, CanonicalId | undefined]>
  return entries.every(([key, value]) => value === undefined || assertion.scope?.[key] === value)
}

function matchesDataset(dataset: CanonicalId | undefined, allowed?: CanonicalId[]): boolean {
  return !allowed?.length || (dataset !== undefined && allowed.includes(dataset))
}

function searchText(record: CorpusRecord): string {
  const values: string[] = [record.id, record.record_type]
  if ('kind' in record) values.push(record.kind)
  if ('description' in record && record.description) values.push(record.description)
  if ('labels' in record && record.labels) values.push(...record.labels.map((label) => label.value))
  const textual = textualPayload(record)
  if (textual) {
    if (typeof textual.text === 'string') values.push(textual.text)
    if (typeof textual.reference === 'string') values.push(textual.reference)
    if (Array.isArray(textual.citations)) {
      for (const citation of textual.citations) {
        if (citation && typeof citation === 'object' && typeof (citation as { reference?: unknown }).reference === 'string') {
          values.push((citation as { reference: string }).reference)
        }
      }
    }
  }
  return values.join('\n')
}

function scoreRecord(record: CorpusRecord, text?: string): number | null {
  const needle = text?.trim().toLowerCase()
  if (!needle) return 0
  const id = record.id.toLowerCase()
  const label = preferredLabel(record)?.toLowerCase()
  const haystack = searchText(record).toLowerCase()
  if (id === needle) return 100
  if (label === needle) return 90
  if (id.startsWith(needle)) return 70
  if (label?.startsWith(needle)) return 60
  if (haystack.includes(needle)) return 20
  return null
}

export class MemoryCorpusRepository implements CorpusRepository {
  private readonly records = new Map<CanonicalId, CorpusRecord>()
  private readonly recordDatasets = new Map<CanonicalId, CanonicalId>()
  private readonly datasets: DatasetDescriptor[]

  constructor(
    records: Iterable<CorpusRecord> = [],
    datasets: Iterable<DatasetDescriptor> = [],
    recordDatasets: ReadonlyMap<CanonicalId, CanonicalId> = new Map()
  ) {
    for (const record of records) {
      if (this.records.has(record.id)) throw new Error(`Duplicate canonical record id: ${record.id}`)
      this.records.set(record.id, record)
    }
    this.datasets = [...datasets].sort((a, b) => compareStrings(a.manifest.id, b.manifest.id))
    for (const [recordId, datasetId] of recordDatasets) this.recordDatasets.set(recordId, datasetId)
  }

  async getRecord(id: CanonicalId): Promise<CorpusRecord | null> {
    return this.records.get(id) ?? null
  }

  async getEntity(id: CanonicalId): Promise<Entity | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'entity' ? record : null
  }

  async getResource(id: CanonicalId): Promise<Resource | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'resource' ? record : null
  }

  async getAssertion(id: CanonicalId): Promise<Assertion | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'assertion' ? record : null
  }

  async getEvidence(id: CanonicalId): Promise<Evidence | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'evidence' ? record : null
  }

  async getProvenance(id: CanonicalId): Promise<Provenance | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'provenance' ? record : null
  }

  async getAssessment(id: CanonicalId): Promise<Assessment | null> {
    const record = await this.getRecord(id)
    return record?.record_type === 'assessment' ? record : null
  }

  async getPassage(id: CanonicalId): Promise<Resource | null> {
    const resource = await this.getResource(id)
    return resource?.kind === 'textual.passage' ? resource : null
  }

  async getRecordDataset(id: CanonicalId): Promise<CanonicalId | null> {
    return this.recordDatasets.get(id) ?? null
  }

  async listDatasets(): Promise<DatasetDescriptor[]> {
    return [...this.datasets]
  }

  async resolveDatasetDependencies(id: CanonicalId): Promise<DatasetDependencyResolution | null> {
    return resolveDependencies(this.datasets, id)
  }

  async *iterateRecords(query: CorpusRecordQuery = {}): AsyncIterable<CorpusRecord> {
    const records = [...this.records.values()].sort((a, b) => compareStrings(a.id, b.id))
    for (const record of records) {
      if (query.recordTypes?.length && !query.recordTypes.includes(record.record_type)) continue
      if (query.kinds?.length && (!('kind' in record) || !query.kinds.includes(record.kind))) continue
      const dataset = this.recordDatasets.get(record.id)
      if (!matchesDataset(dataset, query.datasetIds)) continue
      yield record
    }
  }

  async lookupPassages(query: PassageReferenceQuery): Promise<Resource[]> {
    const matches: Resource[] = []
    for await (const record of this.iterateRecords({ recordTypes: ['resource'], datasetIds: query.datasetIds })) {
      if (record.record_type !== 'resource' || record.kind !== 'textual.passage') continue
      const textual = textualPayload(record)
      if (!textual) continue
      if (query.container && textual.container !== query.container) continue
      if (query.unit && textual.unit !== query.unit) continue
      const citations = Array.isArray(textual.citations) ? textual.citations : []
      const citationMatch = citations.some((candidate) => {
        if (!candidate || typeof candidate !== 'object') return false
        const citation = candidate as { reference?: unknown; scheme?: unknown }
        return citation.reference === query.reference && (!query.scheme || citation.scheme === query.scheme)
      })
      if (!citationMatch) continue
      matches.push(record)
      if (query.limit && matches.length >= query.limit) break
    }
    return matches
  }

  async findAssertions(query: AssertionQuery = {}): Promise<Assertion[]> {
    const matches: Assertion[] = []
    for await (const record of this.iterateRecords({ recordTypes: ['assertion'], datasetIds: query.datasetIds })) {
      if (record.record_type !== 'assertion') continue
      if (query.subject && record.subject !== query.subject) continue
      if (query.predicate && record.predicate !== query.predicate) continue
      if (query.objectEntity && (!('entity' in record.object) || record.object.entity !== query.objectEntity)) continue
      if (!matchesScope(record, query.scope)) continue
      matches.push(record)
      if (query.limit && matches.length >= query.limit) break
    }
    return matches
  }

  async getEvidenceForAssertion(id: CanonicalId): Promise<Evidence[]> {
    const assertion = await this.getAssertion(id)
    if (!assertion) return []
    const evidence: Evidence[] = []
    for (const evidenceId of assertion.evidence ?? []) {
      const record = await this.getEvidence(evidenceId)
      if (record) evidence.push(record)
    }
    return evidence
  }

  async traverseAssertionEvidence(id: CanonicalId): Promise<AssertionEvidenceTraversal | null> {
    const assertion = await this.getAssertion(id)
    if (!assertion) return null
    const evidence = await this.getEvidenceForAssertion(id)
    const targets: CorpusRecord[] = []
    const seen = new Set<CanonicalId>()
    for (const item of evidence) {
      if (seen.has(item.target)) continue
      const target = await this.getRecord(item.target)
      if (target) {
        seen.add(item.target)
        targets.push(target)
      }
    }
    return { assertion, evidence, targets }
  }

  async search(query: CorpusSearchQuery): Promise<CorpusSearchResult[]> {
    const results: CorpusSearchResult[] = []
    for await (const record of this.iterateRecords({
      recordTypes: query.recordTypes,
      kinds: query.kinds,
      datasetIds: query.datasetIds
    })) {
      if (query.assertionScope) {
        if (record.record_type !== 'assertion' || !matchesScope(record, query.assertionScope)) continue
      }
      const score = scoreRecord(record, query.text)
      if (score === null) continue
      results.push({
        id: record.id,
        recordType: record.record_type,
        kind: 'kind' in record ? record.kind : undefined,
        label: preferredLabel(record),
        datasetId: this.recordDatasets.get(record.id),
        score
      })
    }
    results.sort((a, b) => b.score - a.score || compareStrings(a.id, b.id))
    const offset = Math.max(0, query.offset ?? 0)
    const limit = Math.max(0, query.limit ?? 50)
    return results.slice(offset, offset + limit)
  }
}

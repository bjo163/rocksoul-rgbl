import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import type { CorpusRepository, DatasetDescriptor } from '@moonwitness/corpus-repository'

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

export interface DerivedCatalogDataset {
  id: CanonicalId
  version: string
  specVersion: string
  profiles: string[]
  status: string
  dependencies: Array<{ dataset: CanonicalId; version: string }>
  counts: { records: number; recordTypes: Record<string, number>; kinds: Record<string, number> }
}

export interface DerivedCatalog {
  format: 'moonwitness-derived-catalog-v1'
  datasets: DerivedCatalogDataset[]
  totals: { records: number; recordTypes: Record<string, number>; kinds: Record<string, number> }
}

export interface DerivedSearchDocument {
  id: CanonicalId
  datasetId?: CanonicalId
  recordType: string
  kind?: string
  label?: string
  text: string
}

export interface DerivedBuildManifest {
  format: 'moonwitness-derived-build-v1'
  files: Array<{ path: string; bytes: number; sha256: string }>
}

function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => compareStrings(a, b))
        .map(([key, child]) => [key, ordered(child)])
    )
  }
  return value
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(ordered(value))
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

function increment(bucket: Record<string, number>, key: string): void {
  bucket[key] = (bucket[key] ?? 0) + 1
}

function preferredLabel(record: CorpusRecord): string | undefined {
  if (!('labels' in record) || !record.labels?.length) return undefined
  return record.labels.find((label) => label.role === 'preferred')?.value ?? record.labels[0]?.value
}

function textual(record: CorpusRecord): Record<string, unknown> | undefined {
  if (record.record_type !== 'resource') return undefined
  const payload = record.extensions?.textual
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : undefined
}

function searchValues(record: CorpusRecord): string[] {
  const values: string[] = [record.id, record.record_type]
  if ('kind' in record) values.push(record.kind)
  if ('description' in record && record.description) values.push(record.description)
  if ('labels' in record && record.labels) values.push(...record.labels.map((label) => label.value))
  const payload = textual(record)
  if (payload && typeof payload.text === 'string') values.push(payload.text)
  if (payload && Array.isArray(payload.citations)) {
    for (const candidate of payload.citations) {
      if (candidate && typeof candidate === 'object') {
        const reference = (candidate as { reference?: unknown }).reference
        if (typeof reference === 'string') values.push(reference)
      }
    }
  }
  return values
}

export async function collectRecords(repository: CorpusRepository): Promise<CorpusRecord[]> {
  const records: CorpusRecord[] = []
  for await (const record of repository.iterateRecords()) records.push(record)
  records.sort((a, b) => compareStrings(a.id, b.id))
  return records
}

export async function buildCatalog(repository: CorpusRepository): Promise<DerivedCatalog> {
  const descriptors = await repository.listDatasets()
  const byDataset = new Map<CanonicalId, DerivedCatalogDataset>()
  for (const descriptor of descriptors) {
    byDataset.set(descriptor.manifest.id, {
      id: descriptor.manifest.id,
      version: descriptor.manifest.datasetVersion,
      specVersion: descriptor.manifest.specVersion,
      profiles: [...descriptor.manifest.profiles].sort(),
      status: descriptor.entry.status,
      dependencies: [...(descriptor.manifest.dependencies ?? [])].sort((a, b) =>
        compareStrings(`${a.dataset}@${a.version}`, `${b.dataset}@${b.version}`)
      ),
      counts: { records: 0, recordTypes: {}, kinds: {} }
    })
  }
  const totals = { records: 0, recordTypes: {} as Record<string, number>, kinds: {} as Record<string, number> }

  for await (const record of repository.iterateRecords()) {
    totals.records += 1
    increment(totals.recordTypes, record.record_type)
    if ('kind' in record) increment(totals.kinds, record.kind)
    const datasetId = await repository.getRecordDataset(record.id)
    if (!datasetId) continue
    const dataset = byDataset.get(datasetId)
    if (!dataset) throw new Error(`Record ${record.id} belongs to unregistered dataset ${datasetId}`)
    dataset.counts.records += 1
    increment(dataset.counts.recordTypes, record.record_type)
    if ('kind' in record) increment(dataset.counts.kinds, record.kind)
  }

  return {
    format: 'moonwitness-derived-catalog-v1',
    datasets: [...byDataset.values()].sort((a, b) => compareStrings(a.id, b.id)),
    totals
  }
}

export async function buildSearchIndex(repository: CorpusRepository): Promise<DerivedSearchDocument[]> {
  const documents: DerivedSearchDocument[] = []
  for await (const record of repository.iterateRecords()) {
    documents.push({
      id: record.id,
      datasetId: (await repository.getRecordDataset(record.id)) ?? undefined,
      recordType: record.record_type,
      kind: 'kind' in record ? record.kind : undefined,
      label: preferredLabel(record),
      text: searchValues(record).join('\n')
    })
  }
  return documents.sort((a, b) => compareStrings(a.id, b.id))
}

function jsonl(values: readonly unknown[]): string {
  return values.map((value) => canonicalJson(value)).join('\n') + (values.length ? '\n' : '')
}

async function writeDerivedFile(outputDir: string, path: string, content: string): Promise<{ path: string; bytes: number; sha256: string }> {
  await writeFile(join(outputDir, path), content, 'utf8')
  return { path, bytes: Buffer.byteLength(content, 'utf8'), sha256: sha256(content) }
}

export async function writeDerivedArtifacts(
  repository: CorpusRepository,
  outputDir: string
): Promise<DerivedBuildManifest> {
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  const records = await collectRecords(repository)
  const catalog = await buildCatalog(repository)
  const searchIndex = await buildSearchIndex(repository)

  const files = [
    await writeDerivedFile(outputDir, 'catalog.json', `${canonicalJson(catalog)}\n`),
    await writeDerivedFile(outputDir, 'records.jsonl', jsonl(records)),
    await writeDerivedFile(outputDir, 'search-index.jsonl', jsonl(searchIndex))
  ].sort((a, b) => compareStrings(a.path, b.path))

  const manifest: DerivedBuildManifest = { format: 'moonwitness-derived-build-v1', files }
  await writeFile(join(outputDir, 'build-manifest.json'), `${canonicalJson(manifest)}\n`, 'utf8')
  return manifest
}

export function datasetDescriptorKey(descriptor: DatasetDescriptor): string {
  return `${descriptor.manifest.id}@${descriptor.manifest.datasetVersion}`
}

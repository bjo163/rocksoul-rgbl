import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import type {
  Assessment,
  CanonicalId,
  CorpusRecord,
  Evidence,
  Provenance,
  Resource
} from '@moonwitness/corpus-core'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'
import type { CorpusRepository, DatasetDescriptor } from '@moonwitness/corpus-repository'
import { textualPayload } from './presentation.js'

let repositoryPromise: Promise<FileSystemCorpusRepository> | undefined
let rootPromise: Promise<string> | undefined

async function hasRegistry(candidate: string): Promise<boolean> {
  try {
    await access(resolve(candidate, 'datasets/registry.json'))
    return true
  } catch {
    return false
  }
}

export async function getCorpusRoot(): Promise<string> {
  if (!rootPromise) {
    rootPromise = (async () => {
      const candidates = [
        process.env.MOONWITNESS_CORPUS_ROOT,
        process.cwd(),
        resolve(process.cwd(), '..'),
        resolve(process.cwd(), '../..')
      ].filter((candidate): candidate is string => Boolean(candidate))

      for (const candidate of candidates) {
        const absolute = resolve(candidate)
        if (await hasRegistry(absolute)) return absolute
      }
      throw new Error('Could not locate datasets/registry.json. Set MOONWITNESS_CORPUS_ROOT to the repository root.')
    })()
  }
  return rootPromise
}

export async function getRepository(): Promise<FileSystemCorpusRepository> {
  if (!repositoryPromise) {
    repositoryPromise = getCorpusRoot().then((root) => FileSystemCorpusRepository.open(root))
  }
  return repositoryPromise
}

export async function datasetMap(repository: CorpusRepository): Promise<Map<CanonicalId, DatasetDescriptor>> {
  return new Map((await repository.listDatasets()).map((dataset) => [dataset.manifest.id, dataset]))
}

export interface RecordContext {
  record: CorpusRecord
  dataset: DatasetDescriptor | null
}

export async function getRecordContext(id: CanonicalId): Promise<RecordContext | null> {
  const repository = await getRepository()
  const record = await repository.getRecord(id)
  if (!record) return null
  const datasetId = await repository.getRecordDataset(id)
  const datasets = await datasetMap(repository)
  return { record, dataset: datasetId ? datasets.get(datasetId) ?? null : null }
}

export interface AssertionsAround {
  outgoing: Awaited<ReturnType<CorpusRepository['findAssertions']>>
  incoming: Awaited<ReturnType<CorpusRepository['findAssertions']>>
}

export async function assertionsAround(id: CanonicalId, limit = 24): Promise<AssertionsAround> {
  const repository = await getRepository()
  const [outgoing, incoming] = await Promise.all([
    repository.findAssertions({ subject: id, limit }),
    repository.findAssertions({ objectEntity: id, limit })
  ])
  return { outgoing, incoming }
}

export async function contentForTarget(id: CanonicalId): Promise<Resource[]> {
  const repository = await getRepository()
  const result: Resource[] = []
  for await (const record of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.content'] })) {
    if (record.record_type !== 'resource') continue
    const payload = textualPayload(record)
    if (payload?.target === id) result.push(record)
  }
  return result
}

export async function assessmentsForTarget(id: CanonicalId): Promise<Assessment[]> {
  const repository = await getRepository()
  const result: Assessment[] = []
  for await (const record of repository.iterateRecords({ recordTypes: ['assessment'] })) {
    if (record.record_type === 'assessment' && record.target === id) result.push(record)
  }
  return result
}

export interface EvidenceChainItem {
  evidence: Evidence
  target: CorpusRecord | null
  provenance: Provenance | null
  source: CorpusRecord | null
}

export async function evidenceChainForAssertion(id: CanonicalId): Promise<EvidenceChainItem[]> {
  const repository = await getRepository()
  const evidence = await repository.getEvidenceForAssertion(id)
  return Promise.all(evidence.map(async (item) => {
    const [target, provenance] = await Promise.all([
      repository.getRecord(item.target),
      item.provenance ? repository.getProvenance(item.provenance) : Promise.resolve(null)
    ])
    const source = provenance ? await repository.getRecord(provenance.source) : null
    return { evidence: item, target, provenance, source }
  }))
}

export async function evidenceContext(id: CanonicalId): Promise<EvidenceChainItem | null> {
  const repository = await getRepository()
  const evidence = await repository.getEvidence(id)
  if (!evidence) return null
  const [target, provenance] = await Promise.all([
    repository.getRecord(evidence.target),
    evidence.provenance ? repository.getProvenance(evidence.provenance) : Promise.resolve(null)
  ])
  const source = provenance ? await repository.getRecord(provenance.source) : null
  return { evidence, target, provenance, source }
}

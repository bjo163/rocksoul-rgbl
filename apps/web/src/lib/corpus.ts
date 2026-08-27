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

declare global {
  // eslint-disable-next-line no-var
  var __moonwitness_repository__: Promise<FileSystemCorpusRepository> | undefined
  // eslint-disable-next-line no-var
  var __moonwitness_root__: Promise<string> | undefined
}

async function hasRegistry(candidate: string): Promise<boolean> {
  try {
    await access(resolve(candidate, 'datasets/registry.json'))
    return true
  } catch {
    return false
  }
}

export async function getCorpusRoot(): Promise<string> {
  if (!globalThis.__moonwitness_root__) {
    globalThis.__moonwitness_root__ = (async () => {
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
  return globalThis.__moonwitness_root__
}

export async function getRepository(): Promise<FileSystemCorpusRepository> {
  if (!globalThis.__moonwitness_repository__) {
    globalThis.__moonwitness_repository__ = getCorpusRoot().then((root) => FileSystemCorpusRepository.open(root))
  }
  return globalThis.__moonwitness_repository__
}

export async function datasetMap(repository: CorpusRepository): Promise<Map<CanonicalId, DatasetDescriptor>> {
  return new Map((await repository.listDatasets()).map((dataset) => [dataset.manifest.id, dataset]))
}

export interface CorpusSummary {
  total: number
  resources: number
  assertions: number
  entities: number
}

let summaryPromise: Promise<CorpusSummary> | undefined

export async function getCorpusSummary(): Promise<CorpusSummary> {
  if (!summaryPromise) {
    summaryPromise = (async () => {
      const root = await getCorpusRoot()
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const registryText = await fs.readFile(path.join(root, 'datasets/registry.json'), 'utf8')
      const registry = JSON.parse(registryText) as { datasets: Array<{ path: string }> }

      let total = 0
      let resources = 0
      let assertions = 0
      let entities = 0

      for (const entry of registry.datasets) {
        const coreDir = path.join(root, entry.path, 'data/core')
        try {
          const subdirs = await fs.readdir(coreDir, { withFileTypes: true })
          for (const sub of subdirs) {
            if (!sub.isDirectory()) continue
            const partitionDir = path.join(coreDir, sub.name)
            const files = await fs.readdir(partitionDir)
            for (const file of files) {
              if (!file.endsWith('.jsonl')) continue
              const buf = await fs.readFile(path.join(partitionDir, file))
              let lines = 0
              for (let i = 0; i < buf.length; i++) {
                if (buf[i] === 10) lines++
              }
              if (buf.length > 0 && buf[buf.length - 1] !== 10) lines++
              total += lines
              if (sub.name === 'resources') resources += lines
              else if (sub.name === 'assertions') assertions += lines
              else if (sub.name === 'entities') entities += lines
            }
          }
        } catch {
          // ignore missing directories
        }
      }
      return { total, resources, assertions, entities }
    })()
  }
  return summaryPromise
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

let contentIndexPromise: Promise<Map<CanonicalId, Resource[]>> | undefined

async function getContentIndex(): Promise<Map<CanonicalId, Resource[]>> {
  if (!contentIndexPromise) {
    contentIndexPromise = (async () => {
      const repository = await getRepository()
      const index = new Map<CanonicalId, Resource[]>()
      for await (const record of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.content'] })) {
        if (record.record_type !== 'resource') continue
        const payload = textualPayload(record)
        const target = payload?.target as CanonicalId | undefined
        if (target) {
          const list = index.get(target) ?? []
          list.push(record)
          index.set(target, list)
        }
      }
      return index
    })()
  }
  return contentIndexPromise
}

export async function contentForTarget(id: CanonicalId): Promise<Resource[]> {
  const index = await getContentIndex()
  return index.get(id) ?? []
}

let assessmentIndexPromise: Promise<Map<CanonicalId, Assessment[]>> | undefined

async function getAssessmentIndex(): Promise<Map<CanonicalId, Assessment[]>> {
  if (!assessmentIndexPromise) {
    assessmentIndexPromise = (async () => {
      const repository = await getRepository()
      const index = new Map<CanonicalId, Assessment[]>()
      for await (const record of repository.iterateRecords({ recordTypes: ['assessment'] })) {
        if (record.record_type === 'assessment' && record.target) {
          const list = index.get(record.target) ?? []
          list.push(record)
          index.set(record.target, list)
        }
      }
      return index
    })()
  }
  return assessmentIndexPromise
}

export async function assessmentsForTarget(id: CanonicalId): Promise<Assessment[]> {
  const index = await getAssessmentIndex()
  return index.get(id) ?? []
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

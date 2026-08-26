import { readFile, readdir } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import {
  MemoryCorpusRepository,
  indexDatasets,
  resolveDatasetDependencies,
  type DatasetDescriptor,
  type DatasetManifest,
  type DatasetRegistryEntry
} from '@moonwitness/corpus-repository'

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }

interface DatasetRegistryFile {
  specVersion: string
  datasets: DatasetRegistryEntry[]
}

export interface FileSystemCorpusRepositoryOptions {
  registryPath?: string
  includeStatuses?: string[]
}

function assertInside(base: string, candidate: string, label: string): void {
  const rel = relative(base, candidate)
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label} escapes its allowed root: ${candidate}`)
  }
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

function hasWildcard(path: string): boolean {
  return /[*?]/.test(path)
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`)
}

async function expandPartitionPath(datasetRoot: string, pattern: string): Promise<string[]> {
  const absolutePattern = resolve(datasetRoot, pattern)
  assertInside(datasetRoot, absolutePattern, `Partition path ${JSON.stringify(pattern)}`)
  if (!hasWildcard(pattern)) return [absolutePattern]

  const directory = dirname(absolutePattern)
  assertInside(datasetRoot, directory, `Partition directory ${JSON.stringify(pattern)}`)
  const basenamePattern = absolutePattern.slice(directory.length + 1)
  if (hasWildcard(relative(datasetRoot, directory))) {
    throw new Error(`Partition wildcards are only supported in the final path segment: ${pattern}`)
  }
  const matcher = wildcardToRegExp(basenamePattern)
  const entries = await readdir(directory, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => resolve(directory, entry.name))
    .sort((a, b) => compareStrings(a, b))
}

async function readJsonl(path: string): Promise<CorpusRecord[]> {
  const content = await readFile(path, 'utf8')
  const records: CorpusRecord[] = []
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim()
    if (!line) continue
    try {
      records.push(JSON.parse(line) as CorpusRecord)
    } catch (error) {
      throw new Error(`Invalid JSONL at ${path}:${index + 1}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return records
}

export async function loadDatasetDescriptors(
  rootDir: string,
  options: FileSystemCorpusRepositoryOptions = {}
): Promise<DatasetDescriptor[]> {
  const root = resolve(rootDir)
  const registryPath = resolve(root, options.registryPath ?? 'datasets/registry.json')
  assertInside(root, registryPath, 'Dataset registry path')
  const registry = await readJson<DatasetRegistryFile>(registryPath)
  const allowedStatuses = options.includeStatuses ? new Set(options.includeStatuses) : null
  const descriptors: DatasetDescriptor[] = []

  for (const entry of registry.datasets) {
    if (allowedStatuses && !allowedStatuses.has(entry.status)) continue
    const datasetRoot = resolve(root, entry.path)
    assertInside(root, datasetRoot, `Dataset path for ${entry.id}`)
    const manifest = await readJson<DatasetManifest>(resolve(datasetRoot, 'manifest.json'))
    descriptors.push({ entry, manifest })
  }

  indexDatasets(descriptors)
  for (const descriptor of descriptors) resolveDatasetDependencies(descriptors, descriptor.manifest.id)
  return descriptors.sort((a, b) => compareStrings(a.manifest.id, b.manifest.id))
}

export async function loadCorpusRecords(
  rootDir: string,
  datasets: readonly DatasetDescriptor[]
): Promise<{ records: CorpusRecord[]; recordDatasets: Map<CanonicalId, CanonicalId> }> {
  const root = resolve(rootDir)
  const records: CorpusRecord[] = []
  const recordDatasets = new Map<CanonicalId, CanonicalId>()
  const seen = new Set<CanonicalId>()

  for (const dataset of datasets) {
    const datasetRoot = resolve(root, dataset.entry.path)
    assertInside(root, datasetRoot, `Dataset path for ${dataset.manifest.id}`)
    for (const partition of dataset.manifest.partitions) {
      const files = await expandPartitionPath(datasetRoot, partition.path)
      if (files.length === 0) throw new Error(`Dataset ${dataset.manifest.id} partition matched no files: ${partition.path}`)
      for (const file of files) {
        for (const record of await readJsonl(file)) {
          if (record.record_type !== partition.recordType) {
            throw new Error(
              `Dataset ${dataset.manifest.id} partition ${partition.path} declares ${partition.recordType} but contains ${record.record_type} record ${record.id}`
            )
          }
          if (seen.has(record.id)) throw new Error(`Duplicate canonical record id across loaded datasets: ${record.id}`)
          seen.add(record.id)
          records.push(record)
          recordDatasets.set(record.id, dataset.manifest.id)
        }
      }
    }
  }

  records.sort((a, b) => compareStrings(a.id, b.id))
  return { records, recordDatasets }
}

export class FileSystemCorpusRepository extends MemoryCorpusRepository {
  readonly rootDir: string

  private constructor(
    rootDir: string,
    records: Iterable<CorpusRecord>,
    datasets: Iterable<DatasetDescriptor>,
    recordDatasets: ReadonlyMap<CanonicalId, CanonicalId>
  ) {
    super(records, datasets, recordDatasets)
    this.rootDir = rootDir
  }

  static async open(
    rootDir: string,
    options: FileSystemCorpusRepositoryOptions = {}
  ): Promise<FileSystemCorpusRepository> {
    const root = resolve(rootDir)
    const datasets = await loadDatasetDescriptors(root, options)
    const { records, recordDatasets } = await loadCorpusRecords(root, datasets)
    return new FileSystemCorpusRepository(root, records, datasets, recordDatasets)
  }
}

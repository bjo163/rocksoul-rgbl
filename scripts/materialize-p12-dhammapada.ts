import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { materializeDataset } from './materialize-p5-datasets.js'

const DATASET_ID = 'mw:dataset:dhammapada:sujato'
const LEGACY_DATASET_ID = 'mw:dataset:dhammapada:sujato-1-20'
const DATASET_PATH = 'datasets/dhammapada-sujato'
const RECIPE_PATH = 'ingestion/recipes/dhammapada-sujato'
const UPSTREAM_COMMIT = 'cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6'

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main(): Promise<void> {
  const root = process.cwd()
  const partitions = await materializeDataset(root, RECIPE_PATH, DATASET_PATH)
  const recipe = await readJson<{
    source: { sha256: string; byte_size: number }
  }>(path.join(root, RECIPE_PATH, 'recipe.json'))

  await writeJson(path.join(root, DATASET_PATH, 'manifest.json'), {
    id: DATASET_ID,
    datasetVersion: '0.2.0',
    specVersion: '0.1',
    profiles: ['textual@0.1', 'source@0.1'],
    partitions: [
      { recordType: 'entity', path: 'data/core/entities/*.jsonl' },
      { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
      { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' },
    ],
    sources: [
      'SuttaCentral Bilara: complete Dhammapada, English translation by Bhikkhu Sujato',
      `bilara-data published@${UPSTREAM_COMMIT}`,
      `${RECIPE_PATH}/source/source-manifest.json`,
    ],
    rights: 'Bhikkhu Sujato / SuttaCentral translation dedicated to the public domain via CC0 1.0 according to SuttaCentral publication metadata.',
    availability: 'bundled',
  })

  const registryPath = path.join(root, 'datasets/registry.json')
  const registry = await readJson<{ specVersion: string; datasets: Array<{ id: string; path: string; status: string }> }>(registryPath)
  registry.datasets = registry.datasets.filter((entry) => entry.id !== LEGACY_DATASET_ID && entry.id !== DATASET_ID)
  registry.datasets.push({ id: DATASET_ID, path: DATASET_PATH, status: 'active' })
  registry.datasets.sort((a, b) => a.id.localeCompare(b.id))
  await writeJson(registryPath, registry)

  const coveragePath = path.join(root, 'datasets/coverage.json')
  const coverage = await readJson<{ datasets: Array<Record<string, unknown>> } & Record<string, unknown>>(coveragePath)
  coverage.datasets = coverage.datasets.filter((entry) => entry.datasetId !== LEGACY_DATASET_ID && entry.datasetId !== DATASET_ID)
  coverage.datasets.push({
    datasetId: DATASET_ID,
    path: DATASET_PATH,
    workCollection: 'Dhammapada',
    datasetRole: 'translation',
    availability: 'bundled',
    language: { tag: 'en', script: 'Latn', coverageRole: 'translation' },
    expression: {
      label: 'Sayings of the Dhamma — Bhikkhu Sujato',
      edition: `SuttaCentral Bilara published@${UPSTREAM_COMMIT}`,
    },
    completeness: {
      status: 'complete',
      unit: 'stanza',
      covered: 423,
      expected: 423,
      scope: 'Complete Dhammapada, 26 chapters and 423 stanzas',
    },
    sourceArtifact: {
      revision: `suttacentral/bilara-data@${UPSTREAM_COMMIT}`,
      path: `${RECIPE_PATH}/source/source-manifest.json`,
      sha256: recipe.source.sha256,
      byteSize: recipe.source.byte_size,
    },
    rights: {
      status: 'verified_for_bundled_redistribution',
      license: 'CC0-1.0',
      evidence: `${DATASET_PATH}/LICENSES/SUTTACENTRAL-CC0.md`,
    },
    provenance: {
      manifest: `${DATASET_PATH}/manifest.json`,
      checksums: `${DATASET_PATH}/CHECKSUMS.sha256`,
      recipe: RECIPE_PATH,
    },
    sourceLanguageCoverage: { language: 'pli', status: 'missing_pending_rights_audit' },
    translationCoverage: { en: 'complete', id: 'missing' },
    alignmentCoverage: {
      status: 'blocked_pending_source_language_rights_audit',
      notes: 'Pali↔English alignment must wait for the independent Pali root source/rights decision.',
    },
  })
  coverage.datasets.sort((a, b) => String(a.datasetId).localeCompare(String(b.datasetId)))
  await writeJson(coveragePath, coverage)

  console.log(`Materialized ${DATASET_ID}: ${partitions.reduce((sum, partition) => sum + partition.recordCount, 0)} records`)
  for (const partition of partitions) console.log(`${partition.relativePath}: ${partition.recordCount} records ${partition.sha256}`)
}

await main()

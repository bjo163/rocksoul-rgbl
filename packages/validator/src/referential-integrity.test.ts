import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { validateRepository } from './index.js'

interface TestDataset {
  slug: string
  id: string
  version?: string
  dependencies?: Array<{ dataset: string; version: string }>
  files: Array<{
    recordType: string
    name: string
    records: Record<string, unknown>[]
  }>
}

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'moonwitness-ref-'))
  await mkdir(path.join(root, 'spec/v0.1'), { recursive: true })
  await cp(path.join(process.cwd(), 'spec/v0.1/schemas'), path.join(root, 'spec/v0.1/schemas'), {
    recursive: true
  })
  await cp(path.join(process.cwd(), 'spec/v0.1/vocab'), path.join(root, 'spec/v0.1/vocab'), {
    recursive: true
  })
  return root
}

async function writeDataset(root: string, dataset: TestDataset): Promise<void> {
  const dir = path.join(root, 'datasets', dataset.slug)
  const dataDir = path.join(dir, 'data')
  await mkdir(dataDir, { recursive: true })

  const partitions: Array<{ recordType: string; path: string }> = []
  for (const file of dataset.files) {
    const relativePath = `data/${file.name}`
    partitions.push({ recordType: file.recordType, path: relativePath })
    await writeFile(
      path.join(dir, relativePath),
      `${file.records.map((record) => JSON.stringify(record)).join('\n')}\n`,
      'utf8'
    )
  }

  await writeFile(
    path.join(dir, 'manifest.json'),
    `${JSON.stringify(
      {
        id: dataset.id,
        datasetVersion: dataset.version ?? '1.0.0',
        specVersion: '0.1',
        profiles: [],
        ...(dataset.dependencies ? { dependencies: dataset.dependencies } : {}),
        partitions
      },
      null,
      2
    )}\n`,
    'utf8'
  )
}

async function withRoot(run: (root: string) => Promise<void>): Promise<void> {
  const root = await createRoot()
  try {
    await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const person = {
  id: 'mw:person:example',
  record_type: 'entity',
  kind: 'person'
}

function assertion(subject = 'mw:person:example') {
  return {
    id: 'mw:assertion:example:ref',
    record_type: 'assertion',
    subject,
    predicate: 'mw:predicate:mentions',
    object: { value: 'fixture' },
    assertion_class: 'explicit_source'
  }
}

test('same-dataset references and vocabulary predicate IDs resolve', async () => {
  await withRoot(async (root) => {
    await writeDataset(root, {
      slug: 'a',
      id: 'mw:dataset:example:a',
      files: [
        { recordType: 'entity', name: 'entities.jsonl', records: [person] },
        { recordType: 'assertion', name: 'assertions.jsonl', records: [assertion()] }
      ]
    })

    const report = await validateRepository(root)
    assert.equal(report.valid, true, JSON.stringify(report.findings, null, 2))
  })
})

test('dangling canonical references fail repository validation', async () => {
  await withRoot(async (root) => {
    await writeDataset(root, {
      slug: 'a',
      id: 'mw:dataset:example:a',
      files: [
        {
          recordType: 'assertion',
          name: 'assertions.jsonl',
          records: [assertion('mw:person:missing')]
        }
      ]
    })

    const report = await validateRepository(root)
    assert.equal(report.valid, false)
    assert.equal(
      report.findings.some((finding) =>
        finding.message.includes('Dangling canonical reference subject -> mw:person:missing')
      ),
      true,
      JSON.stringify(report.findings, null, 2)
    )
  })
})

test('declared exact direct dependency permits a cross-dataset reference', async () => {
  await withRoot(async (root) => {
    await writeDataset(root, {
      slug: 'provider',
      id: 'mw:dataset:example:provider',
      version: '2.0.0',
      files: [{ recordType: 'entity', name: 'entities.jsonl', records: [person] }]
    })
    await writeDataset(root, {
      slug: 'consumer',
      id: 'mw:dataset:example:consumer',
      dependencies: [{ dataset: 'mw:dataset:example:provider', version: '2.0.0' }],
      files: [{ recordType: 'assertion', name: 'assertions.jsonl', records: [assertion()] }]
    })

    const report = await validateRepository(root)
    assert.equal(report.valid, true, JSON.stringify(report.findings, null, 2))
  })
})

test('undeclared cross-dataset references fail even when the target exists in the workspace', async () => {
  await withRoot(async (root) => {
    await writeDataset(root, {
      slug: 'provider',
      id: 'mw:dataset:example:provider',
      files: [{ recordType: 'entity', name: 'entities.jsonl', records: [person] }]
    })
    await writeDataset(root, {
      slug: 'consumer',
      id: 'mw:dataset:example:consumer',
      files: [{ recordType: 'assertion', name: 'assertions.jsonl', records: [assertion()] }]
    })

    const report = await validateRepository(root)
    assert.equal(report.valid, false)
    assert.equal(
      report.findings.some((finding) => finding.message.includes('does not declare that dataset as a direct dependency')),
      true,
      JSON.stringify(report.findings, null, 2)
    )
  })
})

test('dependency version mismatch fails validation', async () => {
  await withRoot(async (root) => {
    await writeDataset(root, {
      slug: 'provider',
      id: 'mw:dataset:example:provider',
      version: '1.0.0',
      files: [{ recordType: 'entity', name: 'entities.jsonl', records: [person] }]
    })
    await writeDataset(root, {
      slug: 'consumer',
      id: 'mw:dataset:example:consumer',
      dependencies: [{ dataset: 'mw:dataset:example:provider', version: '2.0.0' }],
      files: [{ recordType: 'assertion', name: 'assertions.jsonl', records: [assertion()] }]
    })

    const report = await validateRepository(root)
    assert.equal(report.valid, false)
    assert.equal(
      report.findings.some((finding) =>
        finding.message.includes('requires 2.0.0 but workspace provides 1.0.0')
      ),
      true,
      JSON.stringify(report.findings, null, 2)
    )
  })
})

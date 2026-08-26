import assert from 'node:assert/strict'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { validateIngestionDefinitions } from './ingestion-definitions.js'

test('repository ingestion definitions are internally consistent and offline-validatable', async () => {
  const findings = await validateIngestionDefinitions(process.cwd())
  assert.deepEqual(findings, [])
})

test('validator rejects mutated raw bytes before parsing', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mw-ingestion-defs-'))
  try {
    await cp(path.join(process.cwd(), 'spec'), path.join(root, 'spec'), { recursive: true })
    await cp(path.join(process.cwd(), 'ingestion'), path.join(root, 'ingestion'), { recursive: true })
    await writeFile(path.join(root, 'ingestion/recipes/example-lines/source.txt'), 'mutated\n', 'utf8')
    const findings = await validateIngestionDefinitions(root)
    assert.equal(findings.some((finding) => finding.code === 'raw-artifact-sha256-mismatch'), true, JSON.stringify(findings, null, 2))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

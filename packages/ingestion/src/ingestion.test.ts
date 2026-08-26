import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { acquireFilesystem } from './connectors/filesystem.js'
import { acquireHttp } from './connectors/http.js'
import { deterministicJsonl } from './canonical-jsonl.js'
import { applyCurationOverlays } from './curation.js'
import { runIngestion } from './pipeline.js'
import { sha256Bytes } from './checksum.js'

const encoder = new TextEncoder()

test('deterministic JSONL sorts object keys and records while preserving array order', () => {
  const output = deterministicJsonl([
    { id: 'mw:resource:z', record_type: 'resource', kind: 'x', extensions: { b: 2, a: [2, 1] } },
    { id: 'mw:resource:a', record_type: 'resource', kind: 'x' }
  ])
  assert.equal(output, '{"id":"mw:resource:a","kind":"x","record_type":"resource"}\n{"extensions":{"a":[2,1],"b":2},"id":"mw:resource:z","kind":"x","record_type":"resource"}\n')
})

test('filesystem acquisition verifies pinned bytes and rejects path escape', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mw-ingest-fs-'))
  try {
    const bytes = encoder.encode('fixture\n')
    await writeFile(path.join(root, 'source.txt'), bytes)
    const sha256 = sha256Bytes(bytes)
    const result = await acquireFilesystem({ kind: 'filesystem', path: 'source.txt', sha256, byte_size: bytes.byteLength }, root)
    assert.equal(result.sha256, sha256)
    await assert.rejects(() => acquireFilesystem({ kind: 'filesystem', path: '../outside.txt', sha256 }, root), /escapes/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('HTTP acquisition is explicit opt-in and verifies returned bytes', async () => {
  const bytes = encoder.encode('remote fixture')
  const source = { kind: 'http' as const, url: 'https://example.invalid/data', sha256: sha256Bytes(bytes), byte_size: bytes.byteLength }
  await assert.rejects(() => acquireHttp(source, { fetchImpl: async () => new Response(bytes) }), /allowNetwork=true/)
  const result = await acquireHttp(source, {
    allowNetwork: true,
    fetchImpl: async () => new Response(bytes, { status: 200 })
  })
  assert.equal(result.sha256, source.sha256)
  assert.equal(typeof result.retrieved_at, 'string')
})

test('curation overlay applies explicit correction and retains provenance metadata', () => {
  const records = [{ id: 'mw:resource:fixture' as const, record_type: 'resource' as const, kind: 'fixture', description: 'before' }]
  const operation = {
    op: 'replace' as const,
    target: 'mw:resource:fixture' as const,
    path: '/description',
    value: 'after',
    reason: 'fixture correction',
    curator: 'mw:agent:curator' as const,
    provenance: 'mw:provenance:curation' as const
  }
  const result = applyCurationOverlays(records, [{ version: '0.1', operations: [operation] }])
  assert.equal((result.records[0] as { description?: string }).description, 'after')
  assert.deepEqual(result.operations, [operation])
  assert.equal(records[0].description, 'before')
})

test('example recipe is byte-for-byte idempotent and offline', async () => {
  const recipeDir = path.resolve('ingestion/recipes/example-lines')
  let fetchCalls = 0
  const fetchImpl: typeof fetch = async () => { fetchCalls++; throw new Error('network should not be used') }
  const first = await runIngestion({ recipeDir, writeOutput: false, fetchImpl })
  const second = await runIngestion({ recipeDir, writeOutput: false, fetchImpl })
  assert.equal(fetchCalls, 0)
  assert.equal(first.output, second.output)
  assert.equal(first.outputSha256, second.outputSha256)
  assert.equal(first.outputSha256, 'cde8695b67cc31102b253a2f41d9db429d02e2ab01d81771027092f288d81e98')
  assert.equal(first.appliedCorrections.length, 1)
  assert.match(first.output, /beta \(curated fixture\)/)
  assert.equal(first.output.includes('retrieved_at'), false)
})

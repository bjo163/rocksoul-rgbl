import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('P14 candidates cannot bundle without resolved rights and a pinned artifact', async () => {
  const file = path.join(process.cwd(), 'datasets/registries/p14-source-discovery.json')
  const registry = JSON.parse(await readFile(file, 'utf8')) as { candidates: Array<Record<string, unknown>> }
  assert.ok(registry.candidates.length >= 6)
  for (const candidate of registry.candidates) {
    if (candidate.bundle === true) {
      assert.notEqual(candidate.rights, 'unresolved')
      assert.match(String(candidate.sha256 ?? ''), /^[a-f0-9]{64}$/)
      assert.ok(String(candidate.source ?? '').length > 0)
    }
  }
})

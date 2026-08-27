import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('P13 textual evidence is scoped and points to existing P12 passages', async () => {
  const rows = (await readFile('datasets/world-religions-textual-evidence/data/core/assertions/p13-textual-evidence.jsonl', 'utf8')).trim().split('\n').map(line => JSON.parse(line) as { subject: string; object: { entity: string }; evidence: string[]; scope?: { tradition?: string }; provenance: string })
  const ids = new Set<string>()
  for (const file of ['datasets/quran-tanzil-uthmani/data/core/resources/part-0001.jsonl', 'datasets/oshb-wlc/data/core/resources/oshb-wlc.jsonl', 'datasets/sblgnt-v1-2/data/core/resources/sblgnt-v1-2.jsonl']) for (const line of (await readFile(file, 'utf8')).trim().split('\n')) ids.add((JSON.parse(line) as { id: string }).id)
  assert.equal(rows.length, 7)
  for (const row of rows) { assert.ok(row.scope?.tradition); assert.equal(row.provenance, 'mw:provenance:p13:textual-evidence:2026-08-27'); assert.ok(row.subject.startsWith('mw:person:')); assert.ok(row.object.entity.startsWith('mw:role:')); assert.ok(row.evidence.every(id => ids.has(id))) }
})

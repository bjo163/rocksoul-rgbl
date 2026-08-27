import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'

test('P13 historicity uncertainty is represented as explicit assessments', async () => {
  const root = process.cwd()
  const lines = (await readFile(path.join(root, 'datasets/world-religions-baseline/data/core/assessments/baseline.jsonl'), 'utf8')).trim().split('\n')
  const assessments = lines.map(line => JSON.parse(line) as { record_type: string; target: string; result: string; evidence?: string[] })
  assert.equal(assessments.length, 10)
  assert.ok(assessments.every(item => item.record_type === 'assessment'))
  assert.ok(assessments.every(item => item.result === 'historicity_unresolved'))
  assert.ok(assessments.every(item => item.target.startsWith('mw:person:')))
  assert.ok(assessments.every(item => item.evidence?.includes('mw:artifact:wikidata:p13-baseline-2026-08-27')))
})

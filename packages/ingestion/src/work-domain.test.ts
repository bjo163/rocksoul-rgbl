import assert from 'node:assert/strict'
import test from 'node:test'
import { metadataFromWork, validateAttribution, type WorkAttribution } from './work-domain.js'

test('work metadata preserves explicit registry fields without inventing authority identifiers', () => {
  const metadata = metadataFromWork({ id: 'demo', name: 'Demo Work', workType: 'scripture', traditionId: 'demo-tradition', nativeTitle: 'Demo', compositionDate: 'c. 15th Century CE' })
  assert.equal(metadata.workId, 'demo')
  assert.deepEqual(metadata.alternateTitles, ['Demo'])
  assert.equal(metadata.datePrecision, 'APPROXIMATE')
  assert.equal(metadata.dateStatus, 'UNCERTAIN')
  assert.deepEqual(metadata.externalIdentifiers, [])
})

test('attribution validation keeps traditional and attributed claims distinct', () => {
  const evidence = { sourceId: 'mw:source:test', sourceIdentifier: 'test', locator: 'test', evidence: 'test', status: 'TRADITIONAL' as const, confidence: 'MEDIUM' as const }
  const traditional: WorkAttribution = { workId: 'demo', role: 'TRADITIONAL_ATTRIBUTION', status: 'TRADITIONAL', evidence }
  assert.deepEqual(validateAttribution(traditional), [])
  assert.ok(validateAttribution({ ...traditional, status: 'HISTORICALLY_ESTABLISHED' }).includes('traditional attribution must retain TRADITIONAL status'))
})

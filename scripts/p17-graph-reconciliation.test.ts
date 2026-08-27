import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { buildP17GraphReconciliationReport, reconcileP17Graph } from './p17-graph-reconciliation.js'

test('P17 graph reconciliation report is deterministic and report-only', async () => {
  const root = process.cwd()
  const generated = await buildP17GraphReconciliationReport(root)
  const committed = JSON.parse(await readFile(path.join(root, 'docs/P17-RECONCILIATION-REPORT.json'), 'utf8'))
  assert.deepEqual(generated, committed)
  assert.equal(generated.automaticMutation, false)
  assert.deepEqual(generated.counts, {
    edges: 16,
    duplicateEdges: 0,
    contradictoryClaims: 0,
    citationAliases: 2,
    selectorDrift: 0,
    datasetVersionChanges: 0,
  })
  assert.deepEqual(generated.citationAliases.map((item) => item.edgeId), [
    'mw:evidence:p17:p12-alignment:1',
    'mw:evidence:p17:p12-alignment:2',
  ])
  assert.equal(generated.guardrails.noAutomaticEdgeMerge, true)
  assert.equal(generated.guardrails.noAutomaticStatusResolution, true)
})

test('P17 reconciliation detects duplicate, contradiction, selector drift, alias, and dependency-version change', () => {
  const base = {
    sourceDataset: 'mw:dataset:test:source',
    sourceVersion: '0.1.0',
    subject: 'mw:person:test',
    edgeType: 'legacy_parallel',
    object: 'mw:passage:test:target',
    reviewState: 'reviewed',
  }
  const edges = [
    { id: 'mw:evidence:test:1', selector: { type: 'TextPositionSelector', start: 1, end: 2 }, extensions: { graph: { ...base, status: 'asserted' } } },
    { id: 'mw:evidence:test:2', selector: { end: 2, start: 1, type: 'TextPositionSelector' }, extensions: { graph: { ...base, status: 'asserted' } } },
    { id: 'mw:evidence:test:3', selector: { type: 'TextPositionSelector', start: 3, end: 4 }, extensions: { graph: { ...base, status: 'negative' } } },
  ]
  const report = reconcileP17Graph(
    edges,
    { legacy_parallel: 'parallel_passage' },
    [{ dataset: 'mw:dataset:test:source', version: '0.2.0' }],
    [{ dataset: 'mw:dataset:test:source', version: '0.1.0' }],
    'mw:dataset:test:graph',
    '0.2.0',
  )
  assert.equal(report.counts.duplicateEdges, 1)
  assert.equal(report.counts.contradictoryClaims, 1)
  assert.equal(report.counts.selectorDrift, 1)
  assert.equal(report.counts.citationAliases, 3)
  assert.deepEqual(report.datasetVersionChanges, [{ dataset: 'mw:dataset:test:source', previousVersion: '0.1.0', currentVersion: '0.2.0' }])
})

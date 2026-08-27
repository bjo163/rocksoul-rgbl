import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P17 coverage registry and immutable snapshot match bundled graph counts and dependencies', async () => {
  const root = process.cwd()
  const datasetRoot = path.join(root, 'datasets/research-graph-baseline')
  const contract = JSON.parse(await readFile(path.join(root, 'docs/P17-CONTRACT-BASELINE.json'), 'utf8')) as { edgeAliases: Record<string, string> }
  const registry = JSON.parse(await readFile(path.join(root, 'docs/P17-GRAPH-SOURCE-REGISTRY.json'), 'utf8')) as { sources: Array<{ confirmedRecords: number }> }
  const coverage = JSON.parse(await readFile(path.join(root, 'docs/P17-COVERAGE-REPORT.json'), 'utf8')) as {
    totals: { confirmedLinks: number; unresolvedCandidateGroups: number }
    edgeTypeCoverage: Array<{ edgeType: string; confirmed: number; status: string }>
    unresolved: string[]
    gates: Record<string, string>
  }
  const snapshot = JSON.parse(await readFile(path.join(datasetRoot, 'snapshot-manifest.json'), 'utf8')) as {
    checksumAlgorithm: string
    dependencies: Array<{ dataset: string; version: string }>
    files: Array<{ path: string; records: number; checksum: string }>
    canonicalEdgeCounts: Record<string, number>
    edgeAliases: Record<string, string>
  }
  const datasetManifest = JSON.parse(await readFile(path.join(datasetRoot, 'manifest.json'), 'utf8')) as { dependencies: Array<{ dataset: string; version: string }> }
  const graphText = await readFile(path.join(datasetRoot, 'data/core/evidence/graph.jsonl'), 'utf8')
  const graphRecords = graphText.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as { extensions: { graph: { edgeType: string } } })

  assert.equal(snapshot.checksumAlgorithm, 'git-blob-sha1')
  assert.deepEqual(snapshot.dependencies, datasetManifest.dependencies)
  assert.deepEqual(snapshot.edgeAliases, contract.edgeAliases)
  assert.ok(snapshot.files.every((entry) => /^[0-9a-f]{40}$/.test(entry.checksum)))

  for (const entry of snapshot.files) {
    const text = await readFile(path.join(datasetRoot, entry.path), 'utf8')
    const records = text.trim().split(/\r?\n/).filter(Boolean).length
    assert.equal(records, entry.records, `${entry.path} record-count drift`)
  }

  const counts: Record<string, number> = {}
  for (const record of graphRecords) {
    const rawType = record.extensions.graph.edgeType
    const canonicalType = contract.edgeAliases[rawType] ?? rawType
    counts[canonicalType] = (counts[canonicalType] ?? 0) + 1
  }
  assert.deepEqual(counts, snapshot.canonicalEdgeCounts)
  assert.equal(graphRecords.length, coverage.totals.confirmedLinks)
  assert.equal(registry.sources.reduce((sum, source) => sum + source.confirmedRecords, 0), coverage.totals.confirmedLinks)
  assert.equal(coverage.unresolved.length, coverage.totals.unresolvedCandidateGroups)
  assert.ok(coverage.edgeTypeCoverage.some((entry) => entry.edgeType === 'parallel_passage' && entry.confirmed === 2))
  assert.equal(coverage.gates.noExhaustivenessClaim, 'pass')
  assert.equal(coverage.gates.confirmedAndUnresolvedSeparated, 'pass')
  assert.equal(coverage.gates.snapshotChecksummed, 'pass')
})

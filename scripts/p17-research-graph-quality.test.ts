import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

type Edge = {
  id: string
  target: string
  provenance: string
  selector: { type: string; passage?: string }
  extensions: { graph: { edgeType: string; sourceDataset: string; sourceVersion: string; subject: string; object: string; method: string; status: string; reviewState: string } }
}

async function walkJsonl(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walkJsonl(full))
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(full)
  }
  return files
}

function hasCycle(edges: Array<[string, string]>): boolean {
  const adjacency = new Map<string, string[]>()
  for (const [from, to] of edges) adjacency.set(from, [...(adjacency.get(from) ?? []), to])
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of adjacency.get(node) ?? []) if (visit(next)) return true
    visiting.delete(node)
    visited.add(node)
    return false
  }
  return [...adjacency.keys()].some(visit)
}

test('P17 graph validation rejects dangling refs, out-of-scope dependencies, invalid selectors, cycles, and contradictory lifecycle states', async () => {
  const root = process.cwd()
  const datasetRoot = path.join(root, 'datasets/research-graph-baseline')
  const graphText = await readFile(path.join(datasetRoot, 'data/core/evidence/graph.jsonl'), 'utf8')
  const edges = graphText.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Edge)
  const manifest = JSON.parse(await readFile(path.join(datasetRoot, 'manifest.json'), 'utf8')) as { dependencies: Array<{ dataset: string; version: string }> }
  const contract = JSON.parse(await readFile(path.join(root, 'docs/P17-CONTRACT-BASELINE.json'), 'utf8')) as {
    edgeTypes: string[]
    edgeAliases: Record<string, string>
    statuses: string[]
    reviewStates: string[]
    validationPolicy: { acyclicEdgeTypes: string[] }
  }
  const dependencyVersions = new Map(manifest.dependencies.map((dep) => [dep.dataset, dep.version]))

  const referencedIds = new Set<string>()
  const lifecycle = new Map<string, Set<string>>()
  const acyclicPairs = new Map<string, Array<[string, string]>>()
  for (const edge of edges) {
    const graph = edge.extensions.graph
    const canonicalType = contract.edgeAliases[graph.edgeType] ?? graph.edgeType
    assert.ok(contract.edgeTypes.includes(canonicalType), `unknown edge type ${graph.edgeType}`)
    assert.equal(dependencyVersions.get(graph.sourceDataset), graph.sourceVersion, `dependency scope/version mismatch for ${edge.id}`)
    assert.equal(edge.selector.type, 'textual_passage', `unsupported selector type for ${edge.id}`)
    assert.ok(edge.selector.passage?.startsWith('mw:'), `invalid passage selector for ${edge.id}`)
    assert.ok(contract.statuses.includes(graph.status), `invalid lifecycle status for ${edge.id}`)
    assert.ok(contract.reviewStates.includes(graph.reviewState), `invalid review state for ${edge.id}`)

    for (const id of [edge.target, edge.provenance, edge.selector.passage, graph.subject, graph.object]) if (id?.startsWith('mw:')) referencedIds.add(id)
    const key = `${canonicalType}|${graph.subject}|${graph.object}|${edge.selector.passage}`
    lifecycle.set(key, new Set([...(lifecycle.get(key) ?? []), graph.status]))
    if (contract.validationPolicy.acyclicEdgeTypes.includes(canonicalType)) {
      acyclicPairs.set(canonicalType, [...(acyclicPairs.get(canonicalType) ?? []), [graph.subject, graph.object]])
    }
  }

  const foundIds = new Set<string>()
  const files = await walkJsonl(path.join(root, 'datasets'))
  for (const file of files) {
    if (foundIds.size === referencedIds.size) break
    const text = await readFile(file, 'utf8')
    if (![...referencedIds].some((id) => !foundIds.has(id) && text.includes(`\"${id}\"`))) continue
    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      const record = JSON.parse(line) as { id?: string }
      if (record.id && referencedIds.has(record.id)) foundIds.add(record.id)
    }
  }
  assert.deepEqual([...referencedIds].filter((id) => !foundIds.has(id)), [], 'dangling graph references')

  for (const [key, statuses] of lifecycle) {
    const contradictory = statuses.has('asserted') && (statuses.has('negative') || statuses.has('absent') || statuses.has('retracted'))
    assert.equal(contradictory, false, `contradictory lifecycle states for ${key}: ${[...statuses].join(', ')}`)
  }
  for (const [edgeType, pairs] of acyclicPairs) assert.equal(hasCycle(pairs), false, `cycle prohibited for ${edgeType}`)
})

test('P17 explanation paths, export policy, and benchmark fixtures remain deterministic and non-generative', async () => {
  const root = process.cwd()
  const datasetRoot = path.join(root, 'datasets/research-graph-baseline')
  const graphText = await readFile(path.join(datasetRoot, 'data/core/evidence/graph.jsonl'), 'utf8')
  const edges = graphText.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Edge)
  const explanation = JSON.parse(await readFile(path.join(root, 'docs/P17-EXPLANATION-PATHS.json'), 'utf8')) as { pathCount: number; requiredHops: string[]; projections: Array<{ records: number }> }
  const benchmarks = JSON.parse(await readFile(path.join(root, 'docs/P17-BENCHMARK-QUERIES.json'), 'utf8')) as { fixtures: Array<{ id: string; shape: string; expected: { status: string; edgeId?: string; usageEdgeId?: string; passage?: string } }> }
  const exportPolicy = JSON.parse(await readFile(path.join(datasetRoot, 'export-policy.json'), 'utf8')) as { partitions: Array<{ recordType: string; path: string; canonical: boolean }>; excludedFromCanonical: string[]; rules: Record<string, boolean> }
  const manifest = JSON.parse(await readFile(path.join(datasetRoot, 'manifest.json'), 'utf8')) as { partitions: Array<{ recordType: string; path: string }> }

  assert.equal(explanation.pathCount, edges.length)
  assert.equal(explanation.projections.reduce((sum, item) => sum + item.records, 0), edges.length)
  assert.deepEqual(explanation.requiredHops, ['edge.id', 'edge.target', 'edge.selector.passage', 'edge.extensions.graph.sourceDataset', 'edge.extensions.graph.sourceVersion', 'edge.provenance'])
  for (const edge of edges) {
    assert.ok(edge.id && edge.target && edge.selector.passage && edge.extensions.graph.sourceDataset && edge.extensions.graph.sourceVersion && edge.provenance)
  }

  assert.equal(benchmarks.fixtures.length, 4)
  assert.deepEqual(benchmarks.fixtures.map((fixture) => fixture.shape), ['person→role→passage', 'term→concept→usage', 'prayer→source→community', 'passage→commentary→citation'])
  const byId = new Map(edges.map((edge) => [edge.id, edge]))
  const personFixture = benchmarks.fixtures.find((fixture) => fixture.id === 'person-role-passage')!
  const personEdge = byId.get(personFixture.expected.edgeId!)!
  assert.equal(personEdge.selector.passage, personFixture.expected.passage)
  const termFixture = benchmarks.fixtures.find((fixture) => fixture.id === 'term-concept-usage')!
  const termEdge = byId.get(termFixture.expected.usageEdgeId!)!
  assert.equal(termEdge.selector.passage, termFixture.expected.passage)
  assert.equal(benchmarks.fixtures.find((fixture) => fixture.id === 'prayer-source-community')!.expected.status, 'unresolved')
  assert.equal(benchmarks.fixtures.find((fixture) => fixture.id === 'passage-commentary-citation')!.expected.status, 'unresolved')

  assert.deepEqual(exportPolicy.partitions.map(({ recordType, path }) => ({ recordType, path })), manifest.partitions)
  assert.ok(exportPolicy.partitions.every((partition) => partition.canonical))
  assert.equal(exportPolicy.rules.generatedTextCannotBecomeCanonicalFact, true)
  assert.equal(exportPolicy.rules.modelOpinionCannotBecomeCanonicalFact, true)
  const canonicalText = [
    await readFile(path.join(datasetRoot, 'data/core/evidence/graph.jsonl'), 'utf8'),
    await readFile(path.join(datasetRoot, 'data/core/resources/graph.jsonl'), 'utf8'),
    await readFile(path.join(datasetRoot, 'data/core/provenance/graph.jsonl'), 'utf8')
  ].join('\n').toLowerCase()
  for (const excluded of exportPolicy.excludedFromCanonical) assert.equal(canonicalText.includes(excluded.toLowerCase()), false, `canonical export contains ${excluded}`)
})

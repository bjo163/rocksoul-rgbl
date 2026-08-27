import { readFile } from 'node:fs/promises'
import path from 'node:path'

type GraphEdge = {
  id: string
  selector?: unknown
  extensions?: { graph?: { edgeType?: string; sourceDataset?: string; sourceVersion?: string; subject?: string; object?: string; status?: string; reviewState?: string } }
}
type Dependency = { dataset: string; version: string }
type CompleteGraph = { edgeType: string; sourceDataset: string; sourceVersion: string; subject: string; object: string; status: string; reviewState?: string }

export interface P17GraphReconciliationReport {
  formatVersion: '1'
  datasetId: string
  datasetVersion: string
  automaticMutation: false
  counts: { edges: number; duplicateEdges: number; contradictoryClaims: number; citationAliases: number; selectorDrift: number; datasetVersionChanges: number }
  duplicateEdges: Array<{ key: string; edgeIds: string[] }>
  contradictoryClaims: Array<{ key: string; edgeIds: string[]; statuses: string[] }>
  citationAliases: Array<{ edgeId: string; alias: string; canonicalType: string }>
  selectorDrift: Array<{ key: string; edgeIds: string[]; selectors: string[] }>
  datasetVersionChanges: Array<{ dataset: string; previousVersion: string; currentVersion: string }>
  dependencyVersions: Dependency[]
  guardrails: { reportOnly: true; noAutomaticEdgeMerge: true; noAutomaticStatusResolution: true; selectorChangesRequireReview: true; versionChangesRequireReview: true }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function graphOf(edge: GraphEdge): CompleteGraph {
  const graph = edge.extensions?.graph
  if (!graph?.sourceDataset || !graph.sourceVersion || !graph.subject || !graph.edgeType || !graph.object || !graph.status) {
    throw new TypeError(`Incomplete graph edge ${edge.id}`)
  }
  return graph as CompleteGraph
}

export function reconcileP17Graph(
  edges: GraphEdge[],
  aliases: Record<string, string>,
  currentDependencies: Dependency[],
  previousDependencies: Dependency[] = currentDependencies,
  datasetId = 'mw:dataset:research-graph:baseline',
  datasetVersion = '0.1.0',
): P17GraphReconciliationReport {
  const duplicateIndex = new Map<string, string[]>()
  const claimIndex = new Map<string, Array<{ id: string; status: string }>>()
  const selectorIndex = new Map<string, Array<{ id: string; selector: string }>>()
  const citationAliases: P17GraphReconciliationReport['citationAliases'] = []

  for (const edge of edges) {
    const graph = graphOf(edge)
    const canonicalType = aliases[graph.edgeType] ?? graph.edgeType
    const selector = canonicalJson(edge.selector ?? null)
    const claimKey = `${graph.sourceDataset}|${graph.sourceVersion}|${graph.subject}|${canonicalType}|${graph.object}`
    const duplicateKey = `${claimKey}|${selector}|${graph.status}|${graph.reviewState ?? ''}`

    duplicateIndex.set(duplicateKey, [...(duplicateIndex.get(duplicateKey) ?? []), edge.id])
    claimIndex.set(claimKey, [...(claimIndex.get(claimKey) ?? []), { id: edge.id, status: graph.status }])
    selectorIndex.set(claimKey, [...(selectorIndex.get(claimKey) ?? []), { id: edge.id, selector }])
    if (canonicalType !== graph.edgeType) citationAliases.push({ edgeId: edge.id, alias: graph.edgeType, canonicalType })
  }

  const duplicateEdges = [...duplicateIndex.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, edgeIds]) => ({ key, edgeIds: [...edgeIds].sort() }))
    .sort((a, b) => a.key.localeCompare(b.key))

  const negativeStates = new Set(['negative', 'absent', 'unmatched', 'retracted'])
  const contradictoryClaims = [...claimIndex.entries()].flatMap(([key, values]) => {
    const statuses = [...new Set(values.map((value) => value.status))].sort()
    const contradictory = statuses.includes('asserted') && statuses.some((status) => negativeStates.has(status))
    return contradictory ? [{ key, edgeIds: values.map((value) => value.id).sort(), statuses }] : []
  }).sort((a, b) => a.key.localeCompare(b.key))

  const selectorDrift = [...selectorIndex.entries()].flatMap(([key, values]) => {
    const selectors = [...new Set(values.map((value) => value.selector))].sort()
    return selectors.length > 1 ? [{ key, edgeIds: values.map((value) => value.id).sort(), selectors }] : []
  }).sort((a, b) => a.key.localeCompare(b.key))

  const previous = new Map(previousDependencies.map((dependency) => [dependency.dataset, dependency.version]))
  const datasetVersionChanges = currentDependencies.flatMap((dependency) => {
    const previousVersion = previous.get(dependency.dataset)
    return previousVersion && previousVersion !== dependency.version
      ? [{ dataset: dependency.dataset, previousVersion, currentVersion: dependency.version }]
      : []
  }).sort((a, b) => a.dataset.localeCompare(b.dataset))

  citationAliases.sort((a, b) => a.edgeId.localeCompare(b.edgeId))
  const dependencyVersions = [...currentDependencies].sort((a, b) => a.dataset.localeCompare(b.dataset))
  return {
    formatVersion: '1', datasetId, datasetVersion, automaticMutation: false,
    counts: {
      edges: edges.length,
      duplicateEdges: duplicateEdges.length,
      contradictoryClaims: contradictoryClaims.length,
      citationAliases: citationAliases.length,
      selectorDrift: selectorDrift.length,
      datasetVersionChanges: datasetVersionChanges.length,
    },
    duplicateEdges,
    contradictoryClaims,
    citationAliases,
    selectorDrift,
    datasetVersionChanges,
    dependencyVersions,
    guardrails: { reportOnly: true, noAutomaticEdgeMerge: true, noAutomaticStatusResolution: true, selectorChangesRequireReview: true, versionChangesRequireReview: true },
  }
}

export async function buildP17GraphReconciliationReport(root = process.cwd()): Promise<P17GraphReconciliationReport> {
  const graphText = await readFile(path.join(root, 'datasets/research-graph-baseline/data/core/evidence/graph.jsonl'), 'utf8')
  const edges = graphText.trim().split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line) as GraphEdge)
  const snapshot = JSON.parse(await readFile(path.join(root, 'datasets/research-graph-baseline/snapshot-manifest.json'), 'utf8')) as {
    datasetId: string; datasetVersion: string; dependencies: Dependency[]; edgeAliases: Record<string, string>
  }
  return reconcileP17Graph(edges, snapshot.edgeAliases, snapshot.dependencies, snapshot.dependencies, snapshot.datasetId, snapshot.datasetVersion)
}

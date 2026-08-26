import type { Assertion, CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import type { CorpusRepository } from '@moonwitness/corpus-repository'
import { assertionObjectText, clampGraphDepth, displayName } from './presentation.js'

export interface GraphNode {
  id: CanonicalId
  label: string
  recordType: CorpusRecord['record_type']
  kind?: string
}

export interface GraphEdge {
  assertion: Assertion
  subject: CanonicalId
  objectId?: CanonicalId
  objectLabel: string
}

export interface BoundedGraph {
  depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  truncated: boolean
}

export async function buildBoundedGraph(
  repository: CorpusRepository,
  seed: CanonicalId,
  requestedDepth: unknown,
  limits: { nodes?: number; edges?: number } = {}
): Promise<BoundedGraph> {
  const depth = clampGraphDepth(requestedDepth)
  const maxNodes = limits.nodes ?? 32
  const maxEdges = limits.edges ?? 64
  const nodes = new Map<CanonicalId, GraphNode>()
  const edges = new Map<CanonicalId, GraphEdge>()
  const queue: Array<{ id: CanonicalId; depth: number }> = [{ id: seed, depth: 0 }]
  const expanded = new Set<CanonicalId>()
  let truncated = false

  async function addNode(id: CanonicalId): Promise<boolean> {
    if (nodes.has(id)) return true
    if (nodes.size >= maxNodes) {
      truncated = true
      return false
    }
    const record = await repository.getRecord(id)
    if (!record) return false
    nodes.set(id, {
      id,
      label: displayName(record),
      recordType: record.record_type,
      kind: 'kind' in record ? record.kind : undefined
    })
    return true
  }

  await addNode(seed)

  while (queue.length) {
    const current = queue.shift()!
    if (current.depth >= depth || expanded.has(current.id)) continue
    expanded.add(current.id)

    const [outgoing, incoming] = await Promise.all([
      repository.findAssertions({ subject: current.id, limit: 24 }),
      repository.findAssertions({ objectEntity: current.id, limit: 24 })
    ])

    for (const assertion of [...outgoing, ...incoming]) {
      if (edges.has(assertion.id)) continue
      if (edges.size >= maxEdges) {
        truncated = true
        break
      }
      const objectId = 'entity' in assertion.object ? assertion.object.entity : undefined
      edges.set(assertion.id, {
        assertion,
        subject: assertion.subject,
        objectId,
        objectLabel: assertionObjectText(assertion.object)
      })

      const neighbors = [assertion.subject, objectId].filter((id): id is CanonicalId => Boolean(id))
      for (const neighbor of neighbors) {
        if (await addNode(neighbor) && !expanded.has(neighbor)) {
          queue.push({ id: neighbor, depth: current.depth + 1 })
        }
      }
    }
    if (edges.size >= maxEdges) break
  }

  return {
    depth,
    nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edges.values()].sort((a, b) => a.assertion.id.localeCompare(b.assertion.id)),
    truncated
  }
}

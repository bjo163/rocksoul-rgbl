import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { getRecordContext, getRepository } from '../../../lib/corpus.js'
import { buildBoundedGraph } from '../../../lib/graph.js'
import { CanonicalLink, RecordMetadata } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function GraphPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context) notFound()
  const depthParam = (await searchParams).depth
  const depth = Array.isArray(depthParam) ? depthParam[0] : depthParam
  const repository = await getRepository()
  const graph = await buildBoundedGraph(repository, id, depth)

  return (
    <>
      <header className="page-header"><p className="eyebrow">Bounded relation explorer</p><h1>{context.record.id}</h1><p>Edges are corpus assertions. Adjacency is not identity, similarity, equivalence, or endorsement; assertion scope and class remain authoritative.</p></header>
      <RecordMetadata record={context.record} dataset={context.dataset} />
      <form className="search-form" method="get"><select name="depth" defaultValue={String(graph.depth)} aria-label="Traversal depth"><option value="1">Depth 1</option><option value="2">Depth 2</option><option value="3">Depth 3</option></select><button type="submit">Rebuild bounded view</button></form>
      {graph.truncated ? <p className="notice">Traversal reached the safety cap. Increase precision by following a specific node rather than expanding an unbounded graph.</p> : null}

      <section className="section"><p className="eyebrow">{graph.nodes.length} nodes</p><h2>Records in this bounded neighborhood</h2><div className="graph-node-list">{graph.nodes.map((node) => <Link className="graph-node" href={`/record/${encodeURIComponent(node.id)}`} key={node.id}>{node.label} · {node.recordType}</Link>)}</div></section>

      <section className="section"><p className="eyebrow">{graph.edges.length} assertion edges</p><h2>Relations</h2><div className="graph-list">{graph.edges.map((edge) => <article className="graph-edge" key={edge.assertion.id}><CanonicalLink id={edge.subject} /><span><CanonicalLink id={edge.assertion.predicate} /><br /><small>{edge.assertion.assertion_class}</small></span><span>{edge.objectId ? <CanonicalLink id={edge.objectId} /> : edge.objectLabel}<br /><Link href={`/assertion/${encodeURIComponent(edge.assertion.id)}`}>inspect assertion</Link></span></article>)}</div></section>
    </>
  )
}

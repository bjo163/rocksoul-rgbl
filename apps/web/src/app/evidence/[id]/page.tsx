import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { evidenceContext, getRecordContext } from '../../../lib/corpus.js'
import { JsonBlock, RecordLink, RecordMetadata, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const [chain, context] = await Promise.all([evidenceContext(id), getRecordContext(id)])
  if (!chain || !context || context.record.record_type !== 'evidence') notFound()
  const evidence = chain.evidence

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Evidence · {evidence.relation}</p>
        <h1>{evidence.id}</h1>
        <p>Evidence points to an exact target and optional selector. It is kept distinct from both the claim it supports and the provenance describing how records were obtained.</p>
      </header>
      <RecordMetadata record={evidence} dataset={context.dataset} />

      <Section title="Target and selector" eyebrow="Evidence pointer">
        <dl className="metadata-grid">
          <div><dt>Relation</dt><dd>{evidence.relation}</dd></div>
          <div><dt>Target</dt><dd>{chain.target ? <RecordLink record={chain.target} /> : evidence.target}</dd></div>
          <div><dt>Provenance</dt><dd>{chain.provenance ? <Link href={`/provenance/${encodeURIComponent(chain.provenance.id)}`}>{chain.provenance.id}</Link> : 'not recorded'}</dd></div>
        </dl>
        {evidence.selector ? <JsonBlock value={evidence.selector} /> : <p className="empty">No exact selector recorded.</p>}
      </Section>

      <Section title="Source chain" eyebrow="Provenance boundary">
        {chain.provenance ? (
          <div className="grid two">
            <article className="card"><p className="eyebrow">Provenance</p><h3><Link href={`/provenance/${encodeURIComponent(chain.provenance.id)}`}>{chain.provenance.id}</Link></h3><p>{chain.provenance.source_reference ?? 'No source reference string recorded.'}</p></article>
            <article className="card"><p className="eyebrow">Source resource</p><h3>{chain.source ? <RecordLink record={chain.source} /> : chain.provenance.source}</h3></article>
          </div>
        ) : <p className="empty">No provenance record linked from this evidence.</p>}
      </Section>
    </>
  )
}

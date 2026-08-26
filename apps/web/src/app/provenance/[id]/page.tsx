import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { getRecordContext, getRepository } from '../../../lib/corpus.js'
import { CanonicalLink, JsonBlock, RecordLink, RecordMetadata, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function ProvenancePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context || context.record.record_type !== 'provenance') notFound()
  const provenance = context.record
  const repository = await getRepository()
  const source = await repository.getRecord(provenance.source)

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Provenance</p>
        <h1>{provenance.id}</h1>
        <p>Provenance records how corpus material was obtained or derived. It is not the evidence selector and not the source resource itself.</p>
      </header>
      <RecordMetadata record={provenance} dataset={context.dataset} />

      <Section title="Source" eyebrow="What resource">
        <div className="card">
          <h3>{source ? <RecordLink record={source} /> : <CanonicalLink id={provenance.source} />}</h3>
          <p>{provenance.source_reference ?? 'No source reference string recorded.'}</p>
        </div>
      </Section>

      <Section title="Activities" eyebrow="How obtained or derived">
        <div className="grid two">{provenance.activities.map((activity, index) => <article className="card" key={index}><JsonBlock value={activity} /></article>)}</div>
      </Section>
      {provenance.extensions ? <Section title="Extensions" eyebrow="Additional provenance data"><JsonBlock value={provenance.extensions} /></Section> : null}
    </>
  )
}

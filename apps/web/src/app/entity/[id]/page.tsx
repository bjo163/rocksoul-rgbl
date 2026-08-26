import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { assertionsAround, getRecordContext } from '../../../lib/corpus.js'
import { AssertionCard, Labels, RecordMetadata, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function EntityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context || context.record.record_type !== 'entity') notFound()
  const entity = context.record
  const assertions = await assertionsAround(entity.id)

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Entity · {entity.kind}</p>
        <h1>{entity.labels?.find((label) => label.role === 'preferred')?.value ?? entity.id}</h1>
        {entity.description ? <p>{entity.description}</p> : null}
      </header>
      <RecordMetadata record={entity} dataset={context.dataset} />
      <Labels record={entity} />
      <div className="actions">
        <Link className="button secondary" href={`/graph/${encodeURIComponent(entity.id)}`}>Explore relations</Link>
        <Link className="button secondary" href={`/compare?left=${encodeURIComponent(entity.id)}`}>Compare without merging</Link>
      </div>
      <Section title="Outgoing assertions" eyebrow="Subject position">
        <div className="assertion-list">{assertions.outgoing.length ? assertions.outgoing.map((assertion) => <AssertionCard key={assertion.id} assertion={assertion} />) : <p className="empty">No outgoing assertions.</p>}</div>
      </Section>
      <Section title="Incoming assertions" eyebrow="Object position">
        <div className="assertion-list">{assertions.incoming.length ? assertions.incoming.map((assertion) => <AssertionCard key={assertion.id} assertion={assertion} />) : <p className="empty">No incoming entity assertions.</p>}</div>
      </Section>
    </>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { assertionsAround, getRecordContext } from '../../../lib/corpus.js'
import { textualPayload } from '../../../lib/presentation.js'
import { AssertionCard, JsonBlock, Labels, RecordMetadata, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context || context.record.record_type !== 'resource') notFound()
  const resource = context.record
  const textual = textualPayload(resource)
  const assertions = await assertionsAround(resource.id)

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Resource · {resource.kind}</p>
        <h1>{resource.labels?.find((label) => label.role === 'preferred')?.value ?? resource.id}</h1>
        {resource.description ? <p>{resource.description}</p> : null}
      </header>
      <RecordMetadata record={resource} dataset={context.dataset} />
      <Labels record={resource} />
      <div className="actions">
        {resource.kind === 'textual.passage' ? <Link className="button" href={`/passage/${encodeURIComponent(resource.id)}`}>Open passage reader</Link> : null}
        <Link className="button secondary" href={`/graph/${encodeURIComponent(resource.id)}`}>Explore relations</Link>
        <Link className="button secondary" href={`/compare?left=${encodeURIComponent(resource.id)}`}>Compare without merging</Link>
      </div>
      {textual ? <Section title="Textual profile payload" eyebrow="Structure"><JsonBlock value={textual} /></Section> : null}
      {resource.extensions && !textual ? <Section title="Extensions" eyebrow="Profile data"><JsonBlock value={resource.extensions} /></Section> : null}
      <Section title="Assertions about this resource" eyebrow="Semantic layer">
        <div className="assertion-list">{assertions.outgoing.length ? assertions.outgoing.map((assertion) => <AssertionCard key={assertion.id} assertion={assertion} />) : <p className="empty">No outgoing assertions.</p>}</div>
      </Section>
    </>
  )
}

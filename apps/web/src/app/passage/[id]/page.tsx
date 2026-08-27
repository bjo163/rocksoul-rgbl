import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { assertionsAround, contentForTarget, getRecordContext } from '../../../lib/corpus.js'
import { isRtlScript, preferredLabel, textualPayload } from '../../../lib/presentation.js'
import { AssertionCard, CanonicalLink, JsonBlock, RecordMetadata, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function PassagePage({ params }: { params: Promise<{ id: string }> }) {
  const rawId = (await params).id
  const id = rawId.includes('%') ? decodeURIComponent(rawId) : rawId
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context || context.record.record_type !== 'resource' || context.record.kind !== 'textual.passage') notFound()
  const passage = context.record
  const payload = textualPayload(passage) ?? {}
  const contents = await contentForTarget(passage.id)
  const assertions = await assertionsAround(passage.id)
  const citations = Array.isArray(payload.citations) ? payload.citations as Array<Record<string, unknown>> : []
  const container = typeof payload.container === 'string' && isCanonicalId(payload.container) ? payload.container : null

  const title = preferredLabel(passage) ?? (citations[0]?.reference ? String(citations[0].reference) : passage.id)

  return (
    <>
      <header className="page-header">
        <span className="section-tag">Pembaca Ayat & Teks</span>
        <h1 className="section-title">{title}</h1>
        <p className="section-desc">
          Unit: <strong>{String(payload.unit ?? 'textual.passage')}</strong>
          {container ? <> · Bagian dari <CanonicalLink id={container} /></> : ''}
        </p>
      </header>
      <RecordMetadata record={passage} dataset={context.dataset} />
      <div className="actions">
        {typeof payload.parent === 'string' && isCanonicalId(payload.parent) ? <Link className="button secondary" href={`/passage/${encodeURIComponent(payload.parent)}`}>Parent passage</Link> : null}
        <Link className="button secondary" href={`/graph/${encodeURIComponent(passage.id)}`}>Explore relations</Link>
      </div>

      <Section title="Citation" eyebrow="Generic citation scheme">
        {citations.length ? <div className="grid two">{citations.map((citation, index) => <article className="card" key={index}><strong>{String(citation.reference ?? 'unlabeled')}</strong><JsonBlock value={citation} /></article>)}</div> : <p className="empty">No citation reference recorded.</p>}
      </Section>

      <Section title="Text content" eyebrow="Representations">
        <div className="reader">
          {contents.length ? contents.map((content) => {
            const text = textualPayload(content) ?? {}
            const script = text.script
            return (
              <article className="content-block" key={content.id}>
                <div className="content-meta"><span>{String(text.language ?? 'language unknown')}</span><span>{String(text.representation ?? 'representation unknown')}</span><span><code>{content.id}</code></span></div>
                <div className="content-text" dir={isRtlScript(script) ? 'rtl' : 'ltr'} lang={typeof text.language === 'string' ? text.language : undefined}>{typeof text.text === 'string' ? text.text : 'No text payload.'}</div>
                {text.derived_from ? <details><summary>Derivation</summary><JsonBlock value={text.derived_from} /></details> : null}
              </article>
            )
          }) : <p className="empty">No textual content targets this passage.</p>}
        </div>
      </Section>

      <Section title="Assertions connected to this passage" eyebrow="Semantic layer">
        <div className="assertion-list">{assertions.outgoing.length ? assertions.outgoing.map((assertion) => <AssertionCard key={assertion.id} assertion={assertion} />) : <p className="empty">No outgoing assertions.</p>}</div>
      </Section>
    </>
  )
}

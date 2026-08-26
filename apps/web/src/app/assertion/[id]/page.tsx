import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { assessmentsForTarget, evidenceChainForAssertion, getRecordContext } from '../../../lib/corpus.js'
import { assertionObjectText } from '../../../lib/presentation.js'
import { CanonicalLink, JsonBlock, RecordLink, RecordMetadata, ScopeView, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function AssertionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context || context.record.record_type !== 'assertion') notFound()
  const assertion = context.record
  const [chain, assessments] = await Promise.all([
    evidenceChainForAssertion(assertion.id),
    assessmentsForTarget(assertion.id)
  ])
  const objectEntity = 'entity' in assertion.object ? assertion.object.entity : null

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Assertion detail</p>
        <h1>{assertion.assertion_class}</h1>
        <p>A semantic claim is displayed with its scope and evidence links intact; this page does not promote it to an unscoped fact.</p>
      </header>
      <RecordMetadata record={assertion} dataset={context.dataset} />

      <Section title="Claim" eyebrow="Subject · predicate · object">
        <article className="assertion-card">
          <div className="assertion-triplet">
            <CanonicalLink id={assertion.subject} />
            <code className="predicate" title="Vocabulary predicate ID">{assertion.predicate}</code>
            {objectEntity ? <CanonicalLink id={objectEntity} /> : <span>{assertionObjectText(assertion.object)}</span>}
          </div>
          <ScopeView assertion={assertion} />
        </article>
        {assertion.provenance ? <p>Assertion provenance: <Link href={`/provenance/${encodeURIComponent(assertion.provenance)}`}>{assertion.provenance}</Link></p> : null}
      </Section>

      <Section title="Evidence chain" eyebrow="Assertion → evidence → exact target → provenance → source">
        {chain.length ? (
          <div className="provenance-chain">
            {chain.map((item, index) => (
              <div className="chain-item" key={item.evidence.id}>
                <div className="chain-number">{index + 1}</div>
                <article className="chain-body">
                  <p className="eyebrow">{item.evidence.relation}</p>
                  <h3><Link href={`/evidence/${encodeURIComponent(item.evidence.id)}`}>{item.evidence.id}</Link></h3>
                  <dl className="metadata-grid">
                    <div><dt>Target</dt><dd>{item.target ? <RecordLink record={item.target} /> : <CanonicalLink id={item.evidence.target} />}</dd></div>
                    <div><dt>Provenance</dt><dd>{item.provenance ? <Link href={`/provenance/${encodeURIComponent(item.provenance.id)}`}>{item.provenance.id}</Link> : 'not recorded'}</dd></div>
                    <div><dt>Source</dt><dd>{item.source ? <RecordLink record={item.source} /> : item.provenance ? <CanonicalLink id={item.provenance.source} /> : 'not recorded'}</dd></div>
                  </dl>
                  {item.evidence.selector ? <><h4>Exact selector</h4><JsonBlock value={item.evidence.selector} /></> : <p className="muted">No selector recorded.</p>}
                </article>
              </div>
            ))}
          </div>
        ) : <p className="empty">This assertion has no linked evidence records.</p>}
      </Section>

      <Section title="Assessments" eyebrow="Evaluator-specific">
        {assessments.length ? <div className="grid">{assessments.map((assessment) => <article className="card" key={assessment.id}><p className="eyebrow">{assessment.method}</p><h3>{assessment.result}</h3><p>Confidence: {assessment.confidence ?? 'not recorded'}</p><Link href={`/record/${encodeURIComponent(assessment.id)}`}>Open assessment</Link></article>)}</div> : <p className="empty">No assessments target this assertion.</p>}
      </Section>
    </>
  )
}

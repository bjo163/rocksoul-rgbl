import { notFound, redirect } from 'next/navigation'
import { isCanonicalId } from '@moonwitness/corpus-core'
import { getRecordContext } from '../../../lib/corpus.js'
import { CanonicalLink, JsonBlock, RecordMetadata } from '../../../components/ui.js'
import { hrefForRecord } from '../../../lib/presentation.js'

export const dynamic = 'force-dynamic'

export default async function RecordRouterPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (!isCanonicalId(id)) notFound()
  const context = await getRecordContext(id)
  if (!context) notFound()
  const record = context.record

  if (record.record_type !== 'assessment') {
    redirect(hrefForRecord(record.id, record.record_type, 'kind' in record ? record.kind : undefined))
  }

  return (
    <>
      <header className="page-header"><p className="eyebrow">Assessment</p><h1>{record.id}</h1><p>Assessments are evaluator- and method-specific records, not global confidence labels.</p></header>
      <RecordMetadata record={record} dataset={context.dataset} />
      <dl className="metadata-grid">
        <div><dt>Target</dt><dd><CanonicalLink id={record.target} /></dd></div>
        <div><dt>Result</dt><dd>{record.result}</dd></div>
        <div><dt>Method</dt><dd>{record.method}</dd></div>
        <div><dt>Assessor</dt><dd>{record.assessor ? <CanonicalLink id={record.assessor} /> : 'not recorded'}</dd></div>
        <div><dt>Confidence</dt><dd>{record.confidence ?? 'not recorded'}</dd></div>
        <div><dt>Evidence links</dt><dd>{record.evidence?.length ?? 0}</dd></div>
      </dl>
      {record.extensions ? <JsonBlock value={record.extensions} /> : null}
    </>
  )
}

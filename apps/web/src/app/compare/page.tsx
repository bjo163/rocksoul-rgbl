import Link from 'next/link'
import { isCanonicalId, type CanonicalId, type CorpusRecord } from '@moonwitness/corpus-core'
import type { DatasetDescriptor } from '@moonwitness/corpus-repository'
import { assertionsAround, getRecordContext } from '../../lib/corpus.js'
import { COMPARISON_BOUNDARY, displayName } from '../../lib/presentation.js'
import { AssertionCard, RecordMetadata } from '../../components/ui.js'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function ComparePanel({ record, dataset, assertions, side }: { record: CorpusRecord; dataset: DatasetDescriptor | null; assertions: Awaited<ReturnType<typeof assertionsAround>>; side: string }) {
  return (
    <article className="compare-panel">
      <p className="eyebrow">{side} · {record.record_type}</p>
      <h2><Link href={`/record/${encodeURIComponent(record.id)}`}>{displayName(record)}</Link></h2>
      <RecordMetadata record={record} dataset={dataset} />
      <h3>Outgoing assertions</h3>
      <div className="assertion-list">{assertions.outgoing.slice(0, 8).map((assertion) => <AssertionCard key={assertion.id} assertion={assertion} />)}{assertions.outgoing.length === 0 ? <p className="empty">No outgoing assertions.</p> : null}</div>
    </article>
  )
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const leftValue = first(params.left).trim()
  const rightValue = first(params.right).trim()
  const leftId: CanonicalId | null = isCanonicalId(leftValue) ? leftValue : null
  const rightId: CanonicalId | null = isCanonicalId(rightValue) ? rightValue : null
  const [leftContext, rightContext] = await Promise.all([
    leftId ? getRecordContext(leftId) : Promise.resolve(null),
    rightId ? getRecordContext(rightId) : Promise.resolve(null)
  ])
  const [leftAssertions, rightAssertions] = await Promise.all([
    leftContext ? assertionsAround(leftContext.record.id, 12) : Promise.resolve(null),
    rightContext ? assertionsAround(rightContext.record.id, 12) : Promise.resolve(null)
  ])

  return (
    <>
      <header className="page-header"><p className="eyebrow">Boundary-preserving comparison</p><h1>Compare records without merging them.</h1><p>{COMPARISON_BOUNDARY}</p></header>
      <p className="notice"><strong>No similarity score is computed.</strong> Each column retains its own canonical ID, dataset, version, assertions, source context, and perspective scope.</p>
      <form className="search-form" action="/compare" method="get"><input name="left" defaultValue={leftValue} placeholder="Left canonical ID" aria-label="Left canonical ID" /><input name="right" defaultValue={rightValue} placeholder="Right canonical ID" aria-label="Right canonical ID" /><button type="submit">Compare</button></form>
      <section className="section">
        <div className="compare-grid">
          {leftContext && leftAssertions ? <ComparePanel side="Left record" record={leftContext.record} dataset={leftContext.dataset} assertions={leftAssertions} /> : <div className="empty">Enter a valid existing canonical ID for the left record.</div>}
          {rightContext && rightAssertions ? <ComparePanel side="Right record" record={rightContext.record} dataset={rightContext.dataset} assertions={rightAssertions} /> : <div className="empty">Enter a valid existing canonical ID for the right record.</div>}
        </div>
      </section>
    </>
  )
}

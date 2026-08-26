import Link from 'next/link'
import { isCanonicalId } from '@moonwitness/corpus-core'
import type { CanonicalId } from '@moonwitness/corpus-core'
import type { CorpusRecordType } from '@moonwitness/corpus-repository'
import { datasetMap, getRepository } from '../../lib/corpus.js'
import { datasetHref, hrefForRecord } from '../../lib/presentation.js'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>
const recordTypes: CorpusRecordType[] = ['entity', 'resource', 'assertion', 'evidence', 'provenance', 'assessment']

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = first(params.q).trim()
  const typeValue = first(params.type)
  const datasetValue = first(params.dataset)
  const recordType = recordTypes.includes(typeValue as CorpusRecordType) ? typeValue as CorpusRecordType : undefined
  const datasetId = isCanonicalId(datasetValue) ? datasetValue : undefined
  const repository = await getRepository()
  const datasets = await repository.listDatasets()
  const datasetsById = await datasetMap(repository)
  const results = q ? await repository.search({ text: q, recordTypes: recordType ? [recordType] : undefined, datasetIds: datasetId ? [datasetId] : undefined, limit: 100 }) : []

  return (
    <>
      <header className="page-header"><p className="eyebrow">Search</p><h1>Find records without flattening context.</h1><p>Search covers canonical IDs, labels, descriptions, textual content, and citation strings. Results keep their record type and dataset boundary visible.</p></header>
      <form className="search-form" action="/search" method="get">
        <input name="q" defaultValue={q} placeholder="Search text or canonical ID…" aria-label="Search text" />
        <select name="type" defaultValue={recordType ?? ''} aria-label="Record type"><option value="">All record types</option>{recordTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select>
        <select name="dataset" defaultValue={datasetId ?? ''} aria-label="Dataset"><option value="">All datasets</option>{datasets.map((dataset) => <option value={dataset.manifest.id} key={dataset.manifest.id}>{dataset.manifest.id}</option>)}</select>
        <button type="submit">Search</button>
      </form>

      <section className="section">
        <p className="eyebrow">{q ? `${results.length} results` : 'Ready'}</p>
        <h2>{q ? `Results for “${q}”` : 'Enter a query'}</h2>
        {q ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Record</th><th>Type</th><th>Dataset</th><th>Score</th></tr></thead>
              <tbody>{results.map((result) => {
                const dataset = result.datasetId ? datasetsById.get(result.datasetId) : undefined
                return <tr key={result.id}><td><Link href={hrefForRecord(result.id, result.recordType, result.kind)}>{result.label ?? result.id}</Link><br /><code>{result.id}</code></td><td>{result.recordType}{result.kind ? <><br /><small>{result.kind}</small></> : null}</td><td>{dataset ? <Link href={datasetHref(dataset.manifest.id)}>{dataset.manifest.id}</Link> : result.datasetId ?? 'not recorded'}</td><td>{result.score}</td></tr>
              })}</tbody>
            </table>
          </div>
        ) : <p className="empty">Try a canonical ID, a passage citation, a label, or a phrase present in textual content.</p>}
      </section>
    </>
  )
}

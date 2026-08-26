import { notFound } from 'next/navigation'
import { isCanonicalId, type CorpusRecord } from '@moonwitness/corpus-core'
import { getRepository } from '../../../lib/corpus.js'
import { DatasetLink, RecordSummary, Section } from '../../../components/ui.js'

export const dynamic = 'force-dynamic'

export default async function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const rawId = (await params).id
  if (!isCanonicalId(rawId)) notFound()
  const repository = await getRepository()
  const dataset = (await repository.listDatasets()).find((candidate) => candidate.manifest.id === rawId)
  if (!dataset) notFound()

  const counts: Record<CorpusRecord['record_type'], number> = {
    entity: 0,
    resource: 0,
    assertion: 0,
    evidence: 0,
    provenance: 0,
    assessment: 0
  }
  const examples: CorpusRecord[] = []
  for await (const record of repository.iterateRecords({ datasetIds: [dataset.manifest.id] })) {
    counts[record.record_type] += 1
    if (examples.length < 18) examples.push(record)
  }
  const dependencyResolution = await repository.resolveDatasetDependencies(dataset.manifest.id)

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Dataset · {dataset.entry.status}</p>
        <h1>{dataset.manifest.id}</h1>
        <p>Version {dataset.manifest.datasetVersion} using spec {dataset.manifest.specVersion}.</p>
      </header>

      <dl className="metadata-grid">
        <div><dt>Canonical dataset ID</dt><dd><code>{dataset.manifest.id}</code></dd></div>
        <div><dt>Dataset version</dt><dd>{dataset.manifest.datasetVersion}</dd></div>
        <div><dt>Spec version</dt><dd>{dataset.manifest.specVersion}</dd></div>
        <div><dt>Profiles</dt><dd>{dataset.manifest.profiles.join(', ') || 'none'}</dd></div>
        <div><dt>Availability</dt><dd>{dataset.manifest.availability ?? 'not recorded'}</dd></div>
        <div><dt>Partitions</dt><dd>{dataset.manifest.partitions.length}</dd></div>
      </dl>

      <section className="stats">
        <div className="stat"><strong>{counts.entity.toLocaleString()}</strong><span>entities</span></div>
        <div className="stat"><strong>{counts.resource.toLocaleString()}</strong><span>resources</span></div>
        <div className="stat"><strong>{counts.assertion.toLocaleString()}</strong><span>assertions</span></div>
        <div className="stat"><strong>{counts.provenance.toLocaleString()}</strong><span>provenance records</span></div>
      </section>

      <Section title="Sources and rights" eyebrow="Boundary">
        {dataset.manifest.sources?.length ? <ul>{dataset.manifest.sources.map((source) => <li key={source}>{source}</li>)}</ul> : <p className="empty">No source notes recorded.</p>}
        <p className="notice">{dataset.manifest.rights ?? 'Rights statement not recorded in this manifest.'}</p>
      </Section>

      <Section title="Dependency resolution" eyebrow="Pinned inputs">
        {dependencyResolution ? (
          <ol>
            {dependencyResolution.ordered.map((dependency) => <li key={dependency.manifest.id}><DatasetLink dataset={dependency} /> · {dependency.manifest.datasetVersion}</li>)}
          </ol>
        ) : <p className="empty">No dependency resolution available.</p>}
      </Section>

      <Section title="Sample records" eyebrow="Canonical records">
        <div className="grid">{examples.map((record) => <RecordSummary key={record.id} record={record} />)}</div>
      </Section>
    </>
  )
}

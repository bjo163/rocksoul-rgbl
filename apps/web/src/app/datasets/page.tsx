import { getRepository } from '../../lib/corpus.js'
import { DatasetLink } from '../../components/ui.js'

export default async function DatasetsPage() {
  const repository = await getRepository()
  const datasets = await repository.listDatasets()

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Registry</p>
        <h1>Dataset catalog</h1>
        <p>Every pack exposes its own dataset version, spec version, profiles, status, source notes, and rights boundary.</p>
      </header>
      <div className="dataset-list">
        {datasets.map((dataset) => (
          <article className="dataset-row" key={dataset.manifest.id}>
            <div><strong><DatasetLink dataset={dataset} /></strong><small>{dataset.manifest.availability ?? 'availability not recorded'}</small></div>
            <div><small>Dataset</small><br />{dataset.manifest.datasetVersion}</div>
            <div><small>Spec</small><br />{dataset.manifest.specVersion}</div>
            <div><small>Status</small><br />{dataset.entry.status}</div>
          </article>
        ))}
      </div>
    </>
  )
}

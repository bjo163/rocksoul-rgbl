import Link from 'next/link'
import { getCorpusSummary, getRepository } from '../lib/corpus.js'
import { datasetHref } from '../lib/presentation.js'

export default async function HomePage() {
  const repository = await getRepository()
  const [datasets, summary] = await Promise.all([
    repository.listDatasets(),
    getCorpusSummary()
  ])

  const active = datasets.filter((dataset) => dataset.entry.status === 'active')

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Public evidence ledger</p>
          <h1>Trace claims back to exact evidence.</h1>
          <p className="hero-copy">Explore canonical records without collapsing source, tradition, perspective, edition, provenance, or assessment boundaries.</p>
          <form className="search-form" action="/search" method="get">
            <input name="q" placeholder="Search a canonical ID, label, citation, or text…" aria-label="Search corpus" />
            <button type="submit">Search corpus</button>
          </form>
        </div>
        <aside className="hero-note">
          <p className="eyebrow">Core rule</p>
          <strong>Descriptive corpus ≠ normative engine policy.</strong>
          <p className="muted">The explorer shows what records assert, where evidence points, and how data was obtained. It does not decide which worldview is authoritative.</p>
        </aside>
      </section>

      <section className="stats" aria-label="Corpus summary">
        <div className="stat"><strong>{datasets.length.toLocaleString()}</strong><span>dataset packs</span></div>
        <div className="stat"><strong>{summary.total.toLocaleString()}</strong><span>canonical records</span></div>
        <div className="stat"><strong>{summary.resources.toLocaleString()}</strong><span>resources</span></div>
        <div className="stat"><strong>{summary.assertions.toLocaleString()}</strong><span>assertions</span></div>
      </section>

      <section className="section">
        <p className="eyebrow">Active datasets</p>
        <h2>Real source-backed corpus packs</h2>
        <div className="grid two">
          {active.map((dataset) => (
            <article className="card" key={dataset.manifest.id}>
              <p className="eyebrow">{dataset.manifest.profiles.join(' · ')}</p>
              <h3><Link href={datasetHref(dataset.manifest.id)}>{dataset.manifest.id}</Link></h3>
              <p>Dataset {dataset.manifest.datasetVersion} · spec {dataset.manifest.specVersion}</p>
              <code>{dataset.entry.status}</code>
            </article>
          ))}
        </div>
        <div className="actions"><Link className="button secondary" href="/datasets">Browse all datasets</Link></div>
      </section>

      <section className="section">
        <p className="eyebrow">Interpretation boundaries</p>
        <h2>What the explorer refuses to blur</h2>
        <div className="grid">
          <article className="card"><h3>Assertion</h3><p>A scoped semantic claim with an explicit class and optional evidence links.</p></article>
          <article className="card"><h3>Evidence</h3><p>An exact target and selector that supports, contradicts, quotes, contextualizes, or otherwise relates to a claim.</p></article>
          <article className="card"><h3>Assessment</h3><p>An assessor- and method-specific evaluation. Confidence is never treated as an intrinsic global property.</p></article>
        </div>
      </section>
    </>
  )
}

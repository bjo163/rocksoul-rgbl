import Link from 'next/link'
import { getRepository } from '../../lib/corpus.js'
import { datasetHref, getDatasetFriendlyMeta } from '../../lib/presentation.js'

export default async function DatasetsPage() {
  const repository = await getRepository()
  const datasets = await repository.listDatasets()

  const traditionsOrder = ['Islam', 'Kekristenan', 'Yudaisme', 'Buddhisme', 'Hinduisme', 'Lintas Tradisi', 'Sistem']

  const grouped = traditionsOrder.map((tradition) => {
    const items = datasets.filter((d) => {
      const meta = getDatasetFriendlyMeta(d.manifest.id)
      return meta.tradition === tradition
    })
    return { tradition, items }
  }).filter((g) => g.items.length > 0)

  return (
    <>
      <header className="page-header" style={{ marginBottom: '36px' }}>
        <span className="section-tag">Katalog Kanonikal</span>
        <h1 className="section-title">Katalog Dataset & Kitab Suci</h1>
        <p className="section-desc">
          Total <strong>{datasets.length} paket dataset</strong> ber-lisensi bebas hak cipta (CC0/Public Domain) dengan checksum SHA-256 dan provenance terverifikasi.
        </p>
      </header>

      {grouped.map(({ tradition, items }) => (
        <section key={tradition} style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {tradition}
            </h2>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
              {items.length} paket
            </span>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {items.map((dataset) => {
              const meta = getDatasetFriendlyMeta(dataset.manifest.id)
              return (
                <article className="dataset-row" key={dataset.manifest.id}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                      <Link href={datasetHref(dataset.manifest.id)} className="dataset-row-title">
                        {meta.title}
                      </Link>
                      <span className="badge primary" style={{ fontSize: '0.7rem' }}>{meta.badge}</span>
                    </div>
                    <p className="dataset-row-sub" style={{ margin: '4px 0 6px' }}>{meta.subtitle}</p>
                    <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dataset.manifest.id}</code>
                  </div>

                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>Versi</small>
                    <br />
                    <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>v{dataset.manifest.datasetVersion}</span>
                  </div>

                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>Status</small>
                    <br />
                    <span className={`badge ${dataset.entry.status === 'active' ? 'emerald' : 'amber'}`}>
                      {dataset.entry.status}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Link
                      href={datasetHref(dataset.manifest.id)}
                      className="button secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      Buka Paket →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

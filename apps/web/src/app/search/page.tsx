import Link from 'next/link'
import { isCanonicalId } from '@moonwitness/corpus-core'
import type { CanonicalId } from '@moonwitness/corpus-core'
import type { CorpusRecordType } from '@moonwitness/corpus-repository'
import { datasetMap, getDynamicCorpusCatalog, getRepository } from '../../lib/corpus.js'
import { datasetHref, getDatasetFriendlyMeta, hrefForRecord } from '../../lib/presentation.js'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>
const recordTypes: Array<{ type: CorpusRecordType; label: string }> = [
  { type: 'resource', label: 'Teks / Ayat / Leksikon (Resource)' },
  { type: 'entity', label: 'Tokoh / Tradisi / Tempat (Entity)' },
  { type: 'assertion', label: 'Klaim & Relasi (Assertion)' },
  { type: 'evidence', label: 'Bukti & Penanda (Evidence)' },
  { type: 'provenance', label: 'Sumber & Akuisisi (Provenance)' },
  { type: 'assessment', label: 'Penilaian Kritis (Assessment)' }
]

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = first(params.q).trim()
  const typeValue = first(params.type)
  const datasetValue = first(params.dataset)
  const recordType = recordTypes.map((r) => r.type).includes(typeValue as CorpusRecordType) ? typeValue as CorpusRecordType : undefined
  const datasetId = isCanonicalId(datasetValue) ? datasetValue : undefined
  const repository = await getRepository()
  const [datasets, catalog, datasetsById] = await Promise.all([
    repository.listDatasets(),
    getDynamicCorpusCatalog(),
    datasetMap(repository)
  ])

  const results = q ? await repository.search({ text: q, recordTypes: recordType ? [recordType] : undefined, datasetIds: datasetId ? [datasetId] : undefined, limit: 60 }) : []

  return (
    <>
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <span className="section-tag">Pencarian Korpus</span>
        <h1 className="section-title">Temukan Ayat, Doa, Leksikon, & Figur</h1>
        <p className="section-desc">
          Pencarian dinamis mencakup teks sumber bahasa asli, terjemahan Indonesia/Inggris, nama suci, sitasi, dan rekaman evidensi di seluruh {datasets.length} paket dataset.
        </p>
      </header>

      {/* Main Search Filter Form */}
      <form className="hero-search-box" style={{ maxWidth: '100%', marginBottom: '36px' }} action="/search" method="get">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr) auto', gap: '10px', alignItems: 'center' }}>
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              className="search-field"
              name="q"
              defaultValue={q}
              placeholder="Ketik kata kunci, nomor ayat (mis: 1:1), istilah (mis: Logos), atau doa..."
              aria-label="Pencarian teks"
              autoFocus
            />
          </div>

          <select
            name="type"
            defaultValue={recordType ?? ''}
            style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#ffffff', font: 'inherit', fontSize: '0.9rem' }}
          >
            <option value="">Semua Tipe Rekam</option>
            {recordTypes.map((t) => (
              <option value={t.type} key={t.type}>{t.label}</option>
            ))}
          </select>

          <select
            name="dataset"
            defaultValue={datasetId ?? ''}
            style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: '#ffffff', font: 'inherit', fontSize: '0.9rem' }}
          >
            <option value="">Semua Paket Kitab</option>
            {datasets.map((d) => {
              const meta = getDatasetFriendlyMeta(d.manifest.id)
              return (
                <option value={d.manifest.id} key={d.manifest.id}>
                  {meta.icon} {meta.title}
                </option>
              )
            })}
          </select>

          <button className="search-submit-btn" type="submit">
            Cari
          </button>
        </div>
      </form>

      {/* Results or Dynamic Exploration Hubs */}
      {q ? (
        <section style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              Hasil untuk: &ldquo;{q}&rdquo;
            </h2>
            <span className="badge primary" style={{ fontSize: '0.85rem' }}>
              {results.length} hasil ditemukan
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '8px' }}>Tidak ada rekaman yang cocok persis dengan &ldquo;{q}&rdquo;.</p>
              <p style={{ color: 'var(--text-muted)' }}>Coba kata kunci lain atau pilih dari saran topik di bawah.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {results.map((result) => {
                const dataset = result.datasetId ? datasetsById.get(result.datasetId) : undefined
                const meta = result.datasetId ? getDatasetFriendlyMeta(result.datasetId) : undefined
                const linkHref = hrefForRecord(result.id, result.recordType, result.kind)
                return (
                  <article className="card" key={result.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {meta && <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>}
                        <Link href={linkHref} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                          {result.label ?? result.id}
                        </Link>
                        <span className="badge primary" style={{ fontSize: '0.72rem' }}>
                          {result.kind ?? result.recordType}
                        </span>
                      </div>
                      <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.id}</code>
                      {meta && (
                        <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Paket: <Link href={datasetHref(result.datasetId!)}>{meta.title}</Link>
                        </p>
                      )}
                    </div>
                    <div>
                      <Link href={linkHref} className="button secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        Buka Rekam →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <section style={{ marginTop: '20px' }}>
          <div className="section-header">
            <span className="section-tag">Jelajahi Berdasarkan Tradisi</span>
            <h2 className="section-title">Koleksi Teks & Doa Terdaftar</h2>
            <p className="section-desc">Pilih tradisi di bawah untuk mengeksplorasi ayat dan doa yang tersedia di korpus secara otomatis.</p>
          </div>

          <div className="features-grid">
            {catalog.traditions.map((trad) => (
              <div className="feature-box" key={trad.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{trad.icon}</span>
                  <h3 className="feature-title" style={{ margin: 0 }}>{trad.name}</h3>
                </div>
                <p className="feature-desc" style={{ marginBottom: '14px' }}>{trad.subtitle}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {trad.datasets.map((d) => (
                    <Link
                      key={d.id}
                      href={datasetHref(d.id)}
                      className="suggestion-chip"
                      style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      {d.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

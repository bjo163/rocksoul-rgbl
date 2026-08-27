import Link from 'next/link'
import { getCorpusSummary, getDynamicCorpusCatalog, getRepository } from '../lib/corpus.js'
import { datasetHref } from '../lib/presentation.js'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const selectedTraditionId = first(params.tradition).trim().toLowerCase()

  const repository = await getRepository()
  const [datasets, summary, catalog] = await Promise.all([
    repository.listDatasets(),
    getCorpusSummary(),
    getDynamicCorpusCatalog()
  ])

  const selectedTradition = selectedTraditionId
    ? catalog.traditions.find((t) => t.id === selectedTraditionId)
    : undefined

  return (
    <>
      {/* Hero Title & Welcome */}
      <section className="hero-container" style={{ paddingBottom: '32px' }}>
        <div className="hero-pill">
          <span>✨</span> Penjelajah Korpus Lintas Tradisi Agama Dunia
        </div>
        <h1 className="hero-title">
          Pilih Tradisi & Mulai <br />
          <span className="gradient-text">Eksplorasi Teks Suci & Leksikon</span>
        </h1>
        <p className="hero-subtitle">
          Akses <strong>{summary.total.toLocaleString()}</strong> rekaman kanonikal dari <strong>{catalog.traditions.length} tradisi agama dunia</strong> dengan transparansi bukti primer, terjemahan Indonesia & Inggris, dan rantai sanad terverifikasi.
        </p>
      </section>

      {/* Top Gate: Pilih Tradisi (Derived 100% Dynamically from Datasets) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="section-tag">Gerbang Utama</span>
            <h2 className="section-title" style={{ fontSize: '1.5rem', margin: 0 }}>
              {selectedTradition ? `Portal ${selectedTradition.name}` : 'Pilih Tradisi untuk Memulai'}
            </h2>
          </div>
          {selectedTradition && (
            <Link href="/" className="button secondary" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
              ← Tampilkan Semua Tradisi
            </Link>
          )}
        </div>

        {/* Interactive Tradition Portal Selection Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: !selectedTradition ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-surface)',
              border: !selectedTradition ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: !selectedTradition ? '#ffffff' : 'var(--text-secondary)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🌌</span>
            <strong style={{ fontSize: '1rem', color: '#ffffff' }}>Semua Tradisi</strong>
            <small style={{ color: 'var(--text-muted)' }}>{datasets.length} Paket Kitab</small>
          </Link>

          {catalog.traditions.map((trad) => {
            const isSelected = selectedTradition?.id === trad.id
            return (
              <Link
                key={trad.id}
                href={`/?tradition=${encodeURIComponent(trad.id)}`}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(14, 165, 233, 0.18)' : 'var(--bg-surface)',
                  border: isSelected ? `2px solid ${trad.color}` : '1px solid var(--border-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? `0 0 16px ${trad.color}33` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>{trad.icon}</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{trad.name.replace('Tradisi ', '')}</strong>
                {trad.nativeName && (
                  <span style={{ fontSize: '0.75rem', color: trad.color, fontWeight: 700 }}>
                    {trad.nativeName}
                  </span>
                )}
                <small style={{ color: 'var(--text-muted)' }}>{trad.datasets.length} Paket</small>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Scoped View If A Tradition Is Selected */}
      {selectedTradition ? (
        <section style={{ marginBottom: '60px' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${selectedTradition.color}44`,
              borderLeft: `6px solid ${selectedTradition.color}`,
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              marginBottom: '36px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <span style={{ fontSize: '2.5rem' }}>{selectedTradition.icon}</span>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedTradition.name}
                  {selectedTradition.nativeName && (
                    <span style={{ fontSize: '1.1rem', color: selectedTradition.color, marginLeft: '12px', fontWeight: 600 }}>
                      ({selectedTradition.nativeName})
                    </span>
                  )}
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>{selectedTradition.description}</p>
              </div>
            </div>

            {/* Quick Search Scoped to Tradition */}
            <form className="hero-search-box" style={{ maxWidth: '100%', margin: '24px 0 16px' }} action="/search" method="get">
              <div className="search-input-group">
                <span className="search-icon">🔍</span>
                <input
                  className="search-field"
                  name="q"
                  placeholder={`Cari ayat, kata kunci, atau istilah di ${selectedTradition.name}...`}
                  aria-label={`Cari di ${selectedTradition.name}`}
                  autoFocus
                />
                <button className="search-submit-btn" type="submit">
                  Cari di {selectedTradition.name.replace('Tradisi ', '')}
                </button>
              </div>
            </form>
          </div>

          {/* Dataset Packs for this Tradition */}
          <div className="section-header">
            <span className="section-tag">Koleksi Kitab & Manuskrip</span>
            <h3 className="section-title" style={{ fontSize: '1.4rem' }}>
              Paket Data Tersedia ({selectedTradition.datasets.length} Paket)
            </h3>
          </div>

          <div style={{ display: 'grid', gap: '14px', marginBottom: '40px' }}>
            {selectedTradition.datasets.map((d) => (
              <article className="dataset-row" key={d.id}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{selectedTradition.icon}</span>
                    <Link href={datasetHref(d.id)} className="dataset-row-title">
                      {d.title}
                    </Link>
                    <span className="badge primary" style={{ fontSize: '0.7rem' }}>{d.badge}</span>
                  </div>
                  <p className="dataset-row-sub" style={{ margin: '4px 0 6px' }}>{d.subtitle}</p>
                  <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.id}</code>
                </div>

                <div>
                  <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>Versi</small>
                  <br />
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>v{d.datasetVersion}</span>
                </div>

                <div>
                  <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>Status</small>
                  <br />
                  <span className={`badge ${d.status === 'active' ? 'emerald' : 'amber'}`}>
                    {d.status}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <Link
                    href={datasetHref(d.id)}
                    className="button secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Buka Kitab →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Universal Search Box */}
          <section style={{ marginBottom: '40px' }}>
            <form className="hero-search-box" action="/search" method="get">
              <div className="search-input-group">
                <span className="search-icon">🔍</span>
                <input
                  className="search-field"
                  name="q"
                  placeholder="Cari ayat, kata kunci, doa, hadits, atau konsep spiritual..."
                  aria-label="Cari di korpus"
                  autoComplete="off"
                />
                <button className="search-submit-btn" type="submit">
                  Cari Korpus
                </button>
              </div>
            </form>

            {/* Quick Suggestion Pills */}
            <div className="suggestion-bar">
              <span className="suggestion-label">Saran Cepat:</span>
              {catalog.samplePills.map((pill) => (
                <Link key={pill.query} href={`/search?q=${encodeURIComponent(pill.query)}`} className="suggestion-chip">
                  {pill.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Live Statistics Strip */}
          <section className="stats-strip" aria-label="Statistik Korpus">
            <div className="stat-box">
              <span className="stat-number">{summary.total.toLocaleString()}</span>
              <span className="stat-title">Rekaman Kanonikal</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{datasets.length}</span>
              <span className="stat-title">Paket Dataset</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{catalog.traditions.length} Tradisi</span>
              <span className="stat-title">Cakupan Agama Dunia</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">100% CC0 / Pinned</span>
              <span className="stat-title">Integritas & Provenance</span>
            </div>
          </section>

          {/* Full Traditions Grid */}
          <section style={{ marginBottom: '60px' }}>
            <div className="section-header">
              <span className="section-tag">Katalog Lintas Tradisi</span>
              <h2 className="section-title">Koleksi Kitab, Doa, & Leksikon per Agama</h2>
              <p className="section-desc">Pilih tradisi untuk langsung membaca teks suci, terjemahan resmi, kumpulan doa, dan kamus istilahnya.</p>
            </div>

            <div className="traditions-grid">
              {catalog.traditions.map((trad) => (
                <article className="tradition-card" key={trad.id} style={{ ['--card-accent' as string]: trad.color }}>
                  <div>
                    <div className="tradition-header">
                      <div className="tradition-icon-badge">{trad.icon}</div>
                      <div>
                        <h3 className="tradition-name">
                          {trad.name}
                          {trad.nativeName && (
                            <span style={{ fontSize: '0.82rem', color: trad.color, marginLeft: '8px' }}>
                              ({trad.nativeName})
                            </span>
                          )}
                        </h3>
                        <span className="tradition-subtitle">{trad.subtitle}</span>
                      </div>
                    </div>
                    <div className="tradition-body">
                      <p>{trad.description}</p>
                    </div>
                    <ul className="tradition-links-list">
                      {trad.datasets.map((d) => (
                        <li className="tradition-link-item" key={d.id}>
                          <Link href={datasetHref(d.id)}>
                            <span>{d.title}</span>
                            <span className="tradition-link-tag">{d.badge}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <Link
                      href={`/?tradition=${encodeURIComponent(trad.id)}`}
                      className="button secondary"
                      style={{ width: '100%', textAlign: 'center', padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                      Buka Portal {trad.name.replace('Tradisi ', '')} →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Feature Showcase Grid */}
          <section style={{ marginBottom: '60px' }}>
            <div className="section-header">
              <span className="section-tag">Fitur & Alat Bantu Riset</span>
              <h2 className="section-title">Eksplorasi Korpus Berstandar Ilmiah</h2>
              <p className="section-desc">Dirancang untuk riset akademis, kajian lintas agama, dan penelusuran bukti primer tanpa bias sepihak.</p>
            </div>

            <div className="features-grid">
              {catalog.featuredCategories.map((feat) => (
                <article className="feature-box" key={feat.title}>
                  <div className="feature-icon-circle">{feat.icon}</div>
                  <h3 className="feature-title">{feat.title}</h3>
                  <p className="feature-desc">{feat.desc}</p>
                  <Link href={feat.href} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {feat.cta} ({feat.count}) →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}

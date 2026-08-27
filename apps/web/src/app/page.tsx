import Link from 'next/link'
import { getCorpusSummary, getDynamicCorpusCatalog, getRepository } from '../lib/corpus.js'
import { datasetHref } from '../lib/presentation.js'

export default async function HomePage() {
  const repository = await getRepository()
  const [datasets, summary, catalog] = await Promise.all([
    repository.listDatasets(),
    getCorpusSummary(),
    getDynamicCorpusCatalog()
  ])

  return (
    <>
      {/* Hero Section */}
      <section className="hero-container">
        <div className="hero-pill">
          <span>✨</span> Korpus Kanonikal Terbuka & Terverifikasi
        </div>
        <h1 className="hero-title">
          Jelajahi Teks Suci, Doa, & <br />
          <span className="gradient-text">Leksikon Lintas Tradisi Dunia</span>
        </h1>
        <p className="hero-subtitle">
          Akses <strong>{summary.total.toLocaleString()}</strong> rekaman kanonikal dari <strong>{catalog.traditions.length} tradisi agama dunia</strong> dengan teks bahasa asli, terjemahan Indonesia & Inggris, dan rantai bukti terverifikasi.
        </p>

        {/* Hero Search Box */}
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

        {/* Quick Suggestion Pills (Derived Dynamically from Datasets) */}
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

      {/* Explore by Tradition (Derived Dynamically) */}
      <section style={{ marginBottom: '60px' }}>
        <div className="section-header">
          <span className="section-tag">Jelajahi Berdasarkan Tradisi</span>
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
                    <h3 className="tradition-name">{trad.name}</h3>
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
            </article>
          ))}
        </div>
      </section>

      {/* Feature Showcase Grid (Derived Dynamically) */}
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
  )
}

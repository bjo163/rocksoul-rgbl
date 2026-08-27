import Link from 'next/link'
import { getCorpusSummary, getRepository } from '../lib/corpus.js'
import { datasetHref } from '../lib/presentation.js'

export default async function HomePage() {
  const repository = await getRepository()
  const [datasets, summary] = await Promise.all([
    repository.listDatasets(),
    getCorpusSummary()
  ])

  const quickPills = [
    { label: '🕌 Al-Fatihah 1:1', query: '1:1' },
    { label: '✝️ Doa Bapa Kami', query: 'lords-prayer' },
    { label: '☸️ Dhammapada 1:1', query: 'Dhammapada 1:1' },
    { label: '🕉️ Gita 2:47 (Karma)', query: 'karma' },
    { label: '✡️ Shema Yisrael', query: 'shema' },
    { label: '📜 Hadits Arba\'in 1', query: 'arba\'in' },
    { label: '💡 Leksikon: Logos', query: 'logos' },
    { label: '💡 Leksikon: Dharma', query: 'dharma' },
    { label: '💡 Nama Suci: YHWH', query: 'yhwh' },
    { label: '🤲 Sayyid al-Istighfar', query: 'sayyid-al-istighfar' }
  ]

  const traditions = [
    {
      name: 'Tradisi Islam',
      icon: '🕌',
      subtitle: 'Al-Qur\'an, Hadits, Tafsir, & Dzikir',
      color: '#10b981',
      description: 'Teks kanon Al-Qur\'an Rasm Utsmani, Terjemahan Kemenag RI, 40 Hadits Nawawi, Tafsir Klasik, dan Doa Sayyid al-Istighfar.',
      links: [
        { label: 'Al-Qur\'an Al-Karim (Tanzil Utsmani)', href: datasetHref('mw:dataset:quran:tanzil-uthmani'), tag: 'Kitab Suci' },
        { label: 'Al-Qur\'an Terjemahan Kemenag RI', href: datasetHref('mw:dataset:quranenc:indonesian-kemenag'), tag: 'Terjemahan' },
        { label: '40 Hadits Arba\'in An-Nawawi', href: datasetHref('mw:dataset:hadith:nawawi-40'), tag: 'Hadits' },
        { label: 'Doa Sayyid al-Istighfar', href: '/passage/mw%3Apassage%3Adevotional%3Aislam%3Asayyid-al-istighfar', tag: 'Doa' },
        { label: 'Leksikon Arab Qur\'ani', href: datasetHref('mw:dataset:lexicon:quran-arabic-core'), tag: 'Leksikon' }
      ]
    },
    {
      name: 'Tradisi Kekristenan',
      icon: '✝️',
      subtitle: 'Perjanjian Baru, Kredo Kuno, & Liturgi',
      color: '#38bdf8',
      description: 'Teks kritis Yunani SBLGNT, Alkitab Terjemahan Sederhana Indonesia (TSI), Doa Bapa Kami, Pengakuan Iman Rasuli & Nicea, dan Didakhe.',
      links: [
        { label: 'Perjanjian Baru Yunani (SBLGNT)', href: datasetHref('mw:dataset:sblgnt:v1-2'), tag: 'Kitab Suci' },
        { label: 'Alkitab TSI (Bahasa Indonesia)', href: datasetHref('mw:dataset:bible:tsi-2021'), tag: 'Terjemahan' },
        { label: 'Doa Bapa Kami (The Lord\'s Prayer)', href: '/passage/mw%3Apassage%3Adevotional%3Achristianity%3Alords-prayer', tag: 'Doa' },
        { label: 'Didakhe & Kredo Nicea / Rasuli', href: datasetHref('mw:dataset:christianity:early-writings'), tag: 'Kredo' },
        { label: 'Leksikon Yunani (Logos, Agape, Charis)', href: datasetHref('mw:dataset:lexicon:greek-christian-core'), tag: 'Leksikon' }
      ]
    },
    {
      name: 'Tradisi Yudaisme',
      icon: '✡️',
      subtitle: 'Tanakh Ibrani, Mishnah, & Doa',
      color: '#fbbf24',
      description: 'Teks Masoret Tanakh Ibrani (WLC), Traktat Etika Mishnah Pirkei Avot, Doa Shema Yisrael, dan Leksikon Teologi Ibrani.',
      links: [
        { label: 'Tanakh Ibrani (Leningrad Codex WLC)', href: datasetHref('mw:dataset:oshb:wlc'), tag: 'Kitab Suci' },
        { label: 'Mishnah Pirkei Avot (Etika Leluhur)', href: datasetHref('mw:dataset:mishnah:pirkei-avot'), tag: 'Mishnah' },
        { label: 'Doa Shema Yisrael', href: '/passage/mw%3Apassage%3Adevotional%3Ajudaism%3Ashema-yisrael', tag: 'Doa' },
        { label: 'Leksikon Ibrani (YHWH, Berit, Torah)', href: datasetHref('mw:dataset:lexicon:hebrew-biblical-core'), tag: 'Leksikon' }
      ]
    },
    {
      name: 'Tradisi Buddhisme',
      icon: '☸️',
      subtitle: 'Tipitaka Pali, Dhammapada, & Chanting',
      color: '#f97316',
      description: 'Syair suci Dhammapada bahasa Pali, Terjemahan Bhikkhu Sujato & Wikisumber, Lantunan Mettā Sutta, dan Leksikon Pali.',
      links: [
        { label: 'Dhammapada (Bhikkhu Sujato Translation)', href: datasetHref('mw:dataset:dhammapada:sujato'), tag: 'Kitab Suci' },
        { label: 'Dhammapada Bahasa Indonesia', href: datasetHref('mw:dataset:dhammapada:indonesian-wikisource'), tag: 'Terjemahan' },
        { label: 'Mettā Sutta Chanting (Pelimpahan Kasih)', href: '/passage/mw%3Apassage%3Adevotional%3Abuddhism%3Akaraniya-metta-chanting', tag: 'Chanting' },
        { label: 'Leksikon Pali (Dukkha, Citta, Dhamma)', href: datasetHref('mw:dataset:lexicon:dhammapada-core'), tag: 'Leksikon' }
      ]
    },
    {
      name: 'Tradisi Hinduisme',
      icon: '🕉️',
      subtitle: 'Bhagavad Gita, Mantram, & Shloka',
      color: '#a855f7',
      description: 'Shloka-shloka suci Sanskerta Bhagavad Gita, Gāyatrī Mantra, dan Leksikon Filosofis Sanskerta (Dharma, Karma, Moksha, Yoga).',
      links: [
        { label: 'Bhagavad Gita (Sanskerta Dewanagari)', href: datasetHref('mw:dataset:hinduism:bhagavad-gita'), tag: 'Kitab Suci' },
        { label: 'Gāyatrī Mantra (Mantra Gayatri)', href: '/passage/mw%3Apassage%3Adevotional%3Ahinduism%3Agayatri-mantra', tag: 'Mantra' },
        { label: 'Leksikon Sanskerta (Dharma, Moksha, Om)', href: datasetHref('mw:dataset:lexicon:sanskrit-hindu-core'), tag: 'Leksikon' }
      ]
    },
    {
      name: 'Lintas Tradisi & Graf Riset',
      icon: '🌐',
      subtitle: 'Registri Entitas, Doa, & Bukti Riset',
      color: '#0ea5e9',
      description: 'Registri tokoh sejarah dan figur suci P13, kompilasi doa multibahasa P16, serta graf intertekstual kutipan dan tafsir P17.',
      links: [
        { label: 'Kompilasi Doa & Mantram Lintas Tradisi', href: datasetHref('mw:dataset:devotional:baseline'), tag: 'Doa' },
        { label: 'Registri Entitas Agama Dunia (P13)', href: datasetHref('mw:dataset:world-religions:baseline'), tag: 'Entitas' },
        { label: 'Graf Penelitian & Intertekstualitas (P17)', href: datasetHref('mw:dataset:research-graph:baseline'), tag: 'Graf Evidensi' }
      ]
    }
  ]

  const features = [
    {
      icon: '📖',
      title: 'Pembaca Ayat & Teks Suci',
      desc: 'Baca teks sumber bahasa asli (Arab, Yunani, Ibrani, Pali, Sanskerta) berdampingan dengan transliterasi dan terjemahan resmi Indonesia & Inggris.',
      href: '/datasets',
      cta: 'Buka Katalog Teks'
    },
    {
      icon: '🔍',
      title: 'Pencarian Korpus Instan',
      desc: 'Cari kata kunci, topik, kutipan ayat, atau doa di antara 500.000+ rekaman kanonikal dengan filter tradisi dan bahasa.',
      href: '/search',
      cta: 'Coba Pencarian'
    },
    {
      icon: '🤲',
      title: 'Koleksi Doa & Liturgi',
      desc: 'Kumpulan doa harian, kredo kuno, mantra meditasi, dan lantunan suci dunia ber-tinjauan sensitivitas dan konteks praktik.',
      href: '/search?q=devotional',
      cta: 'Jelajahi Doa'
    },
    {
      icon: '📚',
      title: 'Leksikon Teologi Multibahasa',
      desc: 'Kamus konsep spiritual dan nama suci (Ibrani, Yunani, Arab, Pali, Sanskerta) terhubung langsung ke bukti kemunculan di ayat.',
      href: '/search?q=lexicon',
      cta: 'Buka Leksikon'
    },
    {
      icon: '🕸️',
      title: 'Graf Evidensi & Intertekstual',
      desc: 'Telusuri silsilah figur, kutipan langsung lintas teks (misal ayat Tanakh dalam PB), dan rantai tafsir tanpa klaim spekulatif.',
      href: datasetHref('mw:dataset:research-graph:baseline'),
      cta: 'Lihat Graf Riset'
    },
    {
      icon: '⚖️',
      title: 'Perbandingan Teks Berdampingan',
      desc: 'Bandingkan dua teks atau edisi secara transparan berdampingan tanpa memaksakan kesetaraan atau peleburan makna.',
      href: '/compare',
      cta: 'Bandingkan Dokumen'
    }
  ]

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
          Akses <strong>{summary.total.toLocaleString()}</strong> rekaman kanonikal dari 5 tradisi besar dunia (Islam, Kekristenan, Yudaisme, Buddhisme, Hinduisme) dengan teks bahasa asli, terjemahan Indonesia & Inggris, dan rantai bukti terverifikasi.
        </p>

        {/* Hero Search Box */}
        <form className="hero-search-box" action="/search" method="get">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              className="search-field"
              name="q"
              placeholder="Cari ayat, kata kunci, doa, hadits, atau konsep (mis: Al-Fatihah, Bapa Kami, Logos)..."
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
          {quickPills.map((pill) => (
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
          <span className="stat-number">5 Tradisi</span>
          <span className="stat-title">Cakupan Agama Dunia</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">100% CC0 / Pinned</span>
          <span className="stat-title">Integritas & Provenance</span>
        </div>
      </section>

      {/* Explore by Tradition */}
      <section style={{ marginBottom: '60px' }}>
        <div className="section-header">
          <span className="section-tag">Jelajahi Berdasarkan Tradisi</span>
          <h2 className="section-title">Koleksi Kitab, Doa, & Leksikon per Agama</h2>
          <p className="section-desc">Pilih tradisi untuk langsung membaca teks suci, terjemahan resmi, kumpulan doa, dan kamus istilahnya.</p>
        </div>

        <div className="traditions-grid">
          {traditions.map((trad) => (
            <article className="tradition-card" key={trad.name} style={{ ['--card-accent' as string]: trad.color }}>
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
                  {trad.links.map((link) => (
                    <li className="tradition-link-item" key={link.label}>
                      <Link href={link.href}>
                        <span>{link.label}</span>
                        <span className="tradition-link-tag">{link.tag}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
          {features.map((feat) => (
            <article className="feature-box" key={feat.title}>
              <div className="feature-icon-circle">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
              <Link href={feat.href} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {feat.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

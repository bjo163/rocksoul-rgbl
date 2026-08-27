import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ReadHubPage() {
  const scriptures = [
    {
      key: 'quran',
      title: "Al-Qur'an Al-Karim (114 Surah)",
      tradition: 'Islam',
      icon: '🕌',
      badge: 'Arab + Indonesia + English',
      description: 'Baca teks suci Al-Qur\'an Rasm Utsmani lengkap 114 Surah berpasangan langsung dengan Terjemahan Resmi Kemenag RI dan English Rawai Al-Bayan.',
      href: '/read/quran?surah=1'
    },
    {
      key: 'dhammapada',
      title: 'Syair Suci Dhammapada (26 Bab)',
      tradition: 'Buddhisme',
      icon: '☸️',
      badge: 'Pali + Indonesia + English',
      description: 'Baca 423 bait syair kebajikan Dhammapada teks bahasa Pali berpasangan dengan Terjemahan Wikisumber Bahasa Indonesia dan Bhikkhu Sujato English.',
      href: '/read/dhammapada?chapter=1'
    },
    {
      key: 'gita',
      title: 'Bhagavad Gita (18 Adhyaya)',
      tradition: 'Hinduisme',
      icon: '🕉️',
      badge: 'Sanskerta + Indonesia + English',
      description: 'Shloka-shloka suci Sanskerta aksara Dewanagari Bhagavad Gita berpasangan dengan transliterasi dan terjemahan bahasa Indonesia serta Inggris.',
      href: '/read/gita?chapter=2'
    },
    {
      key: 'hadith',
      title: "40 Hadits Arba'in An-Nawawi",
      tradition: 'Islam',
      icon: '📜',
      badge: 'Matn Arab + Sanad + Terjemahan',
      description: 'Kompilasi hadis-hadis pokok rukun Islam dan akhlak karya Imam An-Nawawi berpasangan dengan rantai perawi sanad dan terjemahan resmi.',
      href: '/read/hadith'
    },
    {
      key: 'devotional',
      title: 'Kompilasi Doa & Mantram Lintas Tradisi',
      tradition: 'Lintas Tradisi',
      icon: '🤲',
      badge: 'Doa Harian & Liturgi',
      description: 'Sayyid al-Istighfar, Doa Bapa Kami, Shema Yisrael, Metta Chanting, dan Gayatri Mantra berdampingan dengan terjemahan dan ulasan konteks.',
      href: '/read/devotional'
    }
  ]

  return (
    <>
      <header className="page-header" style={{ marginBottom: '36px' }}>
        <span className="section-tag">Pembaca Kitab Terpadu</span>
        <h1 className="section-title">Baca Teks Suci Berdampingan (Parallel Reader)</h1>
        <p className="section-desc">
          Teks bahasa asli, terjemahan resmi bahasa Indonesia, dan terjemahan bahasa Inggris disajikan <strong>berpasangan ayat-demi-ayat (1-to-1 relational alignment)</strong> tanpa terpisah.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {scriptures.map((s) => (
          <article className="card" key={s.key} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {s.title}
                  </h2>
                  <span className="badge primary" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                    {s.badge}
                  </span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', margin: '14px 0 20px' }}>
                {s.description}
              </p>
            </div>

            <Link href={s.href} className="button" style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700 }}>
              Mulai Membaca →
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}

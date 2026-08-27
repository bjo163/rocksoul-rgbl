import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MoonWitness Corpus Explorer — Penjelajah Teks Suci & Leksikon Dunia',
    template: '%s · MoonWitness Corpus'
  },
  description: 'Aplikasi penjelajah korpus kanonikal teks suci, doa, leksikon, dan manuskrip lintas tradisi agama dunia ber-evidensi terverifikasi.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand-wrapper" href="/">
              <div className="brand-icon">🌙</div>
              <div className="brand-title">
                MoonWitness <span>Corpus</span>
              </div>
            </Link>
            <nav className="nav-links" aria-label="Navigasi Utama">
              <Link className="nav-item" href="/read">
                <span>📖</span> Baca Kitab
              </Link>
              <Link className="nav-item" href="/datasets">
                <span>📦</span> Katalog Dataset
              </Link>
              <Link className="nav-item" href="/search">
                <span>🔍</span> Pencarian
              </Link>
              <Link className="nav-item" href="/search?q=devotional">
                <span>🤲</span> Doa & Liturgi
              </Link>
              <Link className="nav-item" href="/search?q=lexicon">
                <span>📚</span> Leksikon
              </Link>
              <Link className="nav-item nav-cta" href="/compare">
                <span>⚖️</span> Bandingkan Teks
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <strong style={{ color: '#ffffff', display: 'block', marginBottom: '6px' }}>MoonWitness Corpus</strong>
              <p style={{ maxWidth: '640px', lineHeight: '1.6' }}>
                Korpus kanonikal lintas-tradisi yang memisahkan data teks sumber, terjemahan, komentar tafsir, dan rantai sanad/provenance secara transparan tanpa klaim normatif sepihak.
              </p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <code>spec/ + datasets/</code> canonical<br />
                SHA-256 Checksum Verified · CC0 / Public Domain
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

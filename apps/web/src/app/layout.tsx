import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MoonWitness Corpus Explorer',
    template: '%s · MoonWitness Corpus Explorer'
  },
  description: 'A provenance-first explorer for the public MoonWitness canonical corpus.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">MoonWitness <span>Corpus</span></Link>
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/datasets">Datasets</Link>
              <Link href="/search">Search</Link>
              <Link href="/compare">Compare</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <p>Descriptive corpus records are kept separate from application policy. Claims remain scoped to their sources, perspectives, evidence, provenance, and dataset versions.</p>
            <p><code>spec/ + datasets/</code> are canonical; this explorer is a replaceable consumer.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

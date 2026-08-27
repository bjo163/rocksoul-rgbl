import Link from 'next/link'
import { listAvailableScriptureWorks } from '../../lib/corpus.js'

export const dynamic = 'force-dynamic'

export default async function ReadHubPage() {
  const scriptures = await listAvailableScriptureWorks()

  return (
    <>
      <header className="page-header" style={{ marginBottom: '36px' }}>
        <span className="section-tag">Pembaca Kitab Terpadu</span>
        <h1 className="section-title">Baca Teks Suci Berdampingan (Parallel Reader)</h1>
        <p className="section-desc">
          Teks bahasa asli, terjemahan resmi bahasa Indonesia, dan terjemahan bahasa Inggris disajikan <strong>berpasangan ayat-demi-ayat (1-to-1 relational alignment)</strong> secara otomatis dari korpus.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {scriptures.map((s) => (
          <article className="card" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {s.title}
                    {s.nativeTitle && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginLeft: '8px', fontWeight: 600 }}>
                        ({s.nativeTitle})
                      </span>
                    )}
                  </h2>
                  <span className="badge primary" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                    {s.traditionName} · {s.badge}
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

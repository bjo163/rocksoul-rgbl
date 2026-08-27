import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getParallelReaderData } from '../../../lib/corpus.js'
import { isRtlScript } from '../../../lib/presentation.js'

export const dynamic = 'force-dynamic'

type Params = Promise<{ scripture: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function ParallelScriptureReaderPage({
  params,
  searchParams
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { scripture } = await params
  const sParams = await searchParams
  const sectionParam = first(sParams.surah) || first(sParams.chapter) || first(sParams.section) || undefined

  const data = await getParallelReaderData(scripture, sectionParam)
  if (!data) notFound()

  const currentNum = Number(data.currentSection) || 1
  const prevSection = currentNum > 1 ? currentNum - 1 : null
  const nextSection = currentNum < data.totalSections ? currentNum + 1 : null

  const getSectionHref = (num: number) => {
    if (data.key === 'quran') return `/read/quran?surah=${num}`
    if (data.key === 'dhammapada') return `/read/dhammapada?chapter=${num}`
    if (data.key === 'gita') return `/read/gita?chapter=${num}`
    return `/read/${data.key}?section=${num}`
  }

  return (
    <>
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/read" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ← Kembali ke Pilihan Kitab
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '2.5rem' }}>{data.icon}</span>
          <div>
            <h1 className="section-title" style={{ margin: 0 }}>
              {data.title}
            </h1>
            <p className="section-desc" style={{ margin: '4px 0 0' }}>
              {data.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Chapter / Surah Navigation Toolbar */}
      {data.sectionsList.length > 1 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
              Pilih {data.sectionLabel}:
            </span>
            <form action={`/read/${data.key}`} method="get" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <select
                name="section"
                defaultValue={data.currentSection}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  font: 'inherit',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {data.sectionsList.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="button secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Buka
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {prevSection ? (
              <Link href={getSectionHref(prevSection)} className="button secondary" style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
                ← {data.sectionLabel} {prevSection}
              </Link>
            ) : null}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {data.sectionLabel} {data.currentSection} dari {data.totalSections}
            </span>
            {nextSection ? (
              <Link href={getSectionHref(nextSection)} className="button secondary" style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
                {data.sectionLabel} {nextSection} →
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* Paired Ayah / Verse List */}
      <div style={{ display: 'grid', gap: '24px' }}>
        {data.verses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '8px' }}>
              Tidak ada ayat yang ditemukan untuk bagian ini.
            </p>
            <p style={{ color: 'var(--text-muted)' }}>Silakan pilih surah atau bab lain melalui toolbar di atas.</p>
          </div>
        ) : (
          data.verses.map((verse, idx) => {
            const isRtl = isRtlScript(verse.sourceText?.script) || verse.sourceText?.language === 'ar' || verse.sourceText?.language === 'he'

            return (
              <article
                key={verse.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Verse Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(14, 165, 233, 0.15)',
                        color: 'var(--accent-primary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                      {verse.citation ? `Ayat ${verse.citation}` : `Ayat ${idx + 1}`}
                    </strong>
                    {verse.label && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        · {verse.label}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link
                      href={`/passage/${encodeURIComponent(verse.id)}`}
                      className="button secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Rekam Kanonikal →
                    </Link>
                  </div>
                </div>

                {/* 1. Primary Source Text (Arabic / Sanskrit / Pali / Greek / Hebrew) */}
                {verse.sourceText && (
                  <div style={{ marginBottom: '18px' }}>
                    <p
                      style={{
                        fontSize: isRtl ? '1.85rem' : '1.3rem',
                        lineHeight: isRtl ? '2.4' : '1.8',
                        color: '#ffffff',
                        fontWeight: 600,
                        direction: isRtl ? 'rtl' : 'ltr',
                        textAlign: isRtl ? 'right' : 'left',
                        fontFamily: isRtl ? "'Amiri', 'Traditional Arabic', 'SBL Hebrew', serif" : 'inherit',
                        margin: 0
                      }}
                    >
                      {verse.sourceText.text}
                    </p>
                  </div>
                )}

                {/* 2. Indonesian Translation (Kemenag RI / TSI / Wikisumber) */}
                {verse.indonesianText && (
                  <div
                    style={{
                      background: 'rgba(14, 165, 233, 0.06)',
                      borderLeft: '3px solid var(--accent-primary)',
                      borderRadius: '0 8px 8px 0',
                      padding: '14px 18px',
                      marginBottom: verse.englishText ? '12px' : '0'
                    }}
                  >
                    <small style={{ color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      🇮🇩 Terjemahan Bahasa Indonesia
                    </small>
                    <p style={{ fontSize: '1.05rem', color: '#f1f5f9', lineHeight: '1.65', margin: 0 }}>
                      {verse.indonesianText.text}
                    </p>
                  </div>
                )}

                {/* 3. English Translation (Rawai Al-Bayan / Sujato / WEB) */}
                {verse.englishText && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderLeft: '3px solid var(--text-muted)',
                      borderRadius: '0 8px 8px 0',
                      padding: '12px 18px'
                    }}
                  >
                    <small style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      🇬🇧 English Translation
                    </small>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>
                      {verse.englishText.text}
                    </p>
                  </div>
                )}

                {/* 4. Other representations (Transliteration, etc.) */}
                {verse.otherTexts.map((other, oIdx) => (
                  <div key={oIdx} style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <small style={{ fontWeight: 600 }}>{other.language}: </small>
                    <span>{other.text}</span>
                  </div>
                ))}
              </article>
            )
          })
        )}
      </div>

      {/* Bottom Pagination */}
      {data.sectionsList.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          {prevSection ? (
            <Link href={getSectionHref(prevSection)} className="button secondary">
              ← {data.sectionLabel} {prevSection}
            </Link>
          ) : <div />}

          <Link href="/read" className="button secondary">
            Daftar Kitab
          </Link>

          {nextSection ? (
            <Link href={getSectionHref(nextSection)} className="button">
              {data.sectionLabel} {nextSection} →
            </Link>
          ) : <div />}
        </div>
      )}
    </>
  )
}

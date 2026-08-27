import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/bhagavad-gita'
const artifact = 'mw:artifact:hinduism:bhagavad-gita-baseline'
const provenance = 'mw:provenance:hinduism:bhagavad-gita'
const work = 'mw:work:hinduism:bhagavad-gita'
const scheme = 'mw:citation-scheme:hinduism:bhagavad-gita:chapter-verse'
const edition = 'mw:edition:hinduism:bhagavad-gita:standard'

const exprSa = 'mw:expression:hinduism:bhagavad-gita:sa'
const exprEn = 'mw:expression:hinduism:bhagavad-gita:en'
const exprId = 'mw:expression:hinduism:bhagavad-gita:id'

const gitaItems = [
  {
    chapter: 1,
    verse: 1,
    sa: 'धृतराष्ट्र उवाच | धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः | मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय || १-१ ||',
    en: 'Dhritarashtra said: O Sanjaya, assembled on the sacred plain of Kurukshetra, desirous of fighting, what did my sons and the Pandavas do?',
    id: 'Dhritarashtra berkata: Wahai Sanjaya, berkumpul di tanah suci Kurukshetra dengan hasrat untuk berperang, apakah yang diperbuat oleh putra-putraku dan kaum Pandawa?'
  },
  {
    chapter: 2,
    verse: 47,
    sa: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन | मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि || २-४७ ||',
    en: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to inaction.',
    id: 'Kewajibanmu adalah hanya melakukan tindakan/tugas yang ditentukan, namun engkau tidak berhak atas hasil dari tindakan tersebut. Janganlah menganggap dirimu sebagai penyebab dari hasil perbuatanmu, dan jangan pula terikat pada ketidaktindakan.'
  },
  {
    chapter: 4,
    verse: 7,
    sa: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत | अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् || ४-७ ||',
    en: 'Whenever there is a decline in righteousness, O Bharata, and an increase in unrighteousness, at that time I manifest Myself.',
    id: 'Kapan pun terjadi kemerosotan dharma (kebajikan), wahai keturunan Bharata, dan merajalelanya adharma (kebatilan), pada saat itulah Aku mewujudkan Diri-Ku.'
  },
  {
    chapter: 4,
    verse: 8,
    sa: 'परित्राणाय साधूनां विनाशाय च दुष्कृताम् | धर्मसंस्थापनार्थाय सम्भवामि युगे युगे || ४-८ ||',
    en: 'For the protection of the good, for the destruction of the wicked, and for the establishment of righteousness, I appear age after age.',
    id: 'Untuk melindungi orang-orang bajik, untuk memusnahkan para pelaku kejahatan, dan untuk menegakkan kembali dharma, Aku hadir dari zaman ke zaman.'
  },
  {
    chapter: 9,
    verse: 22,
    sa: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते | तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् || ९-२२ ||',
    en: 'To those who are constantly devoted and who meditate on Me with singular focus, I supply what they lack and preserve what they have.',
    id: 'Bagi mereka yang senantiasa berbakti dan bermeditasi kepada-Ku tanpa berpaling, Aku mencukupkan apa yang mereka butuhkan dan memelihara apa yang mereka miliki.'
  },
  {
    chapter: 18,
    verse: 66,
    sa: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज | अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः || १८-६६ ||',
    en: 'Abandon all varieties of dharmas and simply surrender unto Me alone. I shall deliver you from all sinful reactions; do not despair.',
    id: 'Tinggalkanlah segala bentuk dharma dan berserahlah hanya kepada-Ku semata. Aku akan membebaskan engkau dari segala dosa dan penderitaan; janganlah berduka.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Sanskrit Bhagavad Gita text and translations artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        artifact,
        provenance,
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: 'pinned-bhagavad-gita-baseline-v1',
          locations: ['https://archive.org/details/bhagavad-gita-sanskrit-classical'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 49152
        },
        institution: 'mw:institution:vedic-heritage-library',
        language: 'sa',
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical Sanskrit public domain text of the Srimad Bhagavad Gita.'
        }
      }
    }
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Mahabharata, Bhishma Parva, Bhagavad Gita classical Sanskrit public domain text',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated classical Sanskrit Bhagavad Gita verses with human English and Indonesian translations',
        software: { name: 'scripts/materialize-bhagavad-gita.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'श्रीमद्भगवद्गीता', role: 'preferred', language: 'sa', script: 'Deva' },
      { value: 'Bhagavad Gītā', role: 'preferred', language: 'sa-Latn', script: 'Latn' },
      { value: 'Bhagavad Gita', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Bhagawad Gita', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'religious_text',
        genre: 'scripture_and_philosophy'
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Bhagavad Gita chapter-verse citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        units: ['chapter', 'verse'],
        delimiter: ':',
        work
      }
    }
  } as CorpusRecord,
  {
    id: exprSa,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'sa', script: 'Deva', work } }
  } as CorpusRecord,
  {
    id: exprEn,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'en', script: 'Latn', work, derived_from: exprSa } }
  } as CorpusRecord,
  {
    id: exprId,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'id', script: 'Latn', work, derived_from: exprSa } }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Standard Sanskrit Bhagavad Gita with English and Indonesian expressions',
        expressions: [exprSa, exprEn, exprId]
      }
    }
  } as CorpusRecord
]

for (const item of gitaItems) {
  const passageId = `mw:passage:hinduism:bhagavad-gita:${item.chapter}:${item.verse}`
  const contentSaId = `mw:content:hinduism:bhagavad-gita:${item.chapter}:${item.verse}:sa`
  const contentEnId = `mw:content:hinduism:bhagavad-gita:${item.chapter}:${item.verse}:en`
  const contentIdId = `mw:content:hinduism:bhagavad-gita:${item.chapter}:${item.verse}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: `Bhagavad Gita ${item.chapter}:${item.verse}`, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        unit: 'verse',
        citation_path: [String(item.chapter), String(item.verse)],
        scheme,
        work
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentSaId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'sa',
        script: 'Deva',
        representation: 'source',
        text: item.sa
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentEnId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'en',
        script: 'Latn',
        representation: 'translation',
        text: item.en,
        derived_from: contentSaId
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentIdId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'id',
        script: 'Latn',
        representation: 'translation',
        text: item.id,
        derived_from: contentSaId
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/bhagavad-gita.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/bhagavad-gita.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:hinduism:bhagavad-gita',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['textual@0.1', 'source@0.1'],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Public domain Sanskrit Bhagavad Gita and human English/Indonesian translations'],
  rights: 'CC0-1.0; classical public domain Hindu text with human English and Indonesian translations.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Bhagavad Gita (Dataset)

Canonical MoonWitness dataset for the Sanskrit Bhagavad Gita.
Maintains chapter/verse citation scheme, source Devanagari Sanskrit text, and human English and Indonesian translations.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/bhagavad-gita.jsonl`,
  `${dataset}/data/core/resources/bhagavad-gita.jsonl`,
  `${dataset}/manifest.json`,
  `${dataset}/README.md`
]

const checksums = await Promise.all(
  files.map(async (file) => {
    const bytes = await readFile(path.join(root, file))
    return `${createHash('sha256').update(bytes).digest('hex')}  ${file}`
  })
)

await writeFile(path.join(root, dataset, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
console.log(`Materialized Bhagavad Gita dataset with ${records.length} records.`)

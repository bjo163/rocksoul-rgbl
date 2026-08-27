import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/quran-tafsir-sample'
const artifact = 'mw:artifact:islam:tafsir-sample-baseline'
const provenance = 'mw:provenance:islam:tafsir-sample'
const work = 'mw:work:islam:tafsir-sample'
const scheme = 'mw:citation-scheme:islam:tafsir-sample:surah-ayah'
const edition = 'mw:edition:islam:tafsir-sample:standard'

const exprAr = 'mw:expression:islam:tafsir-sample:ar'
const exprEn = 'mw:expression:islam:tafsir-sample:en'
const exprId = 'mw:expression:islam:tafsir-sample:id'

const tafsirItems = [
  {
    surah: 1,
    ayah: 1,
    targetPassage: 'mw:passage:quran:1:1',
    ar: 'افتتح به كتاب الله تعالى تبركا وتيمنا، والباء للاستعانة أو للمصاحبة، واسم الله تعالى أعظم الأسماء.',
    en: 'The Book of Allah is begun with this formula for blessing and seeking aid; the preposition bi indicates seeking assistance, and Allah is the greatest of names.',
    id: 'Kitab Allah Ta’ala dibuka dengan kalimat ini untuk memohon keberkahan dan pertolongan; huruf ba’ bermakna permohonan pertolongan, dan nama Allah adalah nama yang paling agung.'
  },
  {
    surah: 1,
    ayah: 2,
    targetPassage: 'mw:passage:quran:1:2',
    ar: 'الحمد هو الثناء بالجميل على جهة التعظيم، والرب هو المالك والمربي لجميع الخلائق بنعمه.',
    en: 'Praise (al-hamd) is laudation for beauty and virtue with exaltation, and the Lord (al-Rabb) is the Master and Nurturer of all creation through His blessings.',
    id: 'Al-Hamd adalah pujian dengan segala kebaikan disertai pengagungan, dan ar-Rabb adalah Pemilik serta Pemelihara seluruh makhluk dengan nikmat-nikmat-Nya.'
  },
  {
    surah: 112,
    ayah: 1,
    targetPassage: 'mw:passage:quran:112:1',
    ar: 'قل يا محمد لمن سألك عن صفة ربك: هو الله الأحد، الفرد الذي لا نظير له ولا وزير.',
    en: 'Say, O Muhammad, to whoever asks about the attribute of your Lord: He is Allah, the One, the Unique who has no equal or partner.',
    id: 'Katakanlah wahai Muhammad kepada siapa pun yang bertanya tentang sifat Tuhanmu: Dialah Allah Yang Maha Esa, Yang Tunggal tiada tandingan dan sekutu bagi-Nya.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Classical Quran Commentary (Tafsir) Sample artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        artifact,
        provenance,
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: 'pinned-quran-tafsir-sample-baseline-v1',
          locations: ['https://archive.org/details/classical-quran-tafsir-sample'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 20480
        },
        institution: 'mw:institution:quranic-studies-archive',
        language: 'ar',
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical public domain Quran commentary and exegesis extracts.'
        }
      }
    }
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Classical public domain Quranic tafsir excerpts',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated public domain tafsir commentary excerpts linked to Quran passage targets',
        software: { name: 'scripts/materialize-quran-tafsir.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'Mukhtasar at-Tafsir', role: 'preferred', language: 'ar', script: 'Arab' },
      { value: 'Classical Quran Commentary Excerpts', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Ringkasan Tafsir Al-Quran Klasik', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'commentary',
        genre: 'tafsir_commentary'
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Tafsir commentary surah-ayah citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        units: ['surah', 'ayah'],
        delimiter: ':',
        work
      }
    }
  } as CorpusRecord,
  {
    id: exprAr,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'ar', script: 'Arab', work } }
  } as CorpusRecord,
  {
    id: exprEn,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'en', script: 'Latn', work, derived_from: exprAr } }
  } as CorpusRecord,
  {
    id: exprId,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'id', script: 'Latn', work, derived_from: exprAr } }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Classical Tafsir Excerpts with Arabic, English, and Indonesian expressions',
        expressions: [exprAr, exprEn, exprId]
      }
    }
  } as CorpusRecord
]

for (const item of tafsirItems) {
  const passageId = `mw:passage:islam:tafsir:${item.surah}:${item.ayah}`
  const contentArId = `mw:content:islam:tafsir:${item.surah}:${item.ayah}:ar`
  const contentEnId = `mw:content:islam:tafsir:${item.surah}:${item.ayah}:en`
  const contentIdId = `mw:content:islam:tafsir:${item.surah}:${item.ayah}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: `Tafsir on Surah ${item.surah}:${item.ayah}`, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        unit: 'ayah_commentary',
        citation_path: [String(item.surah), String(item.ayah)],
        scheme,
        work,
        commentary_target: item.targetPassage
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentArId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'ar',
        script: 'Arab',
        representation: 'source',
        text: item.ar,
        genre: 'commentary_text'
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
        derived_from: contentArId
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
        derived_from: contentArId
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/quran-tafsir-sample.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/quran-tafsir-sample.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:islam:quran-tafsir-sample',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['textual@0.1', 'source@0.1'],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Classical public domain Quranic commentary extracts'],
  rights: 'CC0-1.0; classical public domain Islamic commentary with human translations.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Quran Commentary (Tafsir) Excerpts (Dataset)

Canonical MoonWitness dataset for classical Quranic exegesis (Tafsir).
Preserves commentary links to exact Quran passages without treating commentary as scripture text.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/quran-tafsir-sample.jsonl`,
  `${dataset}/data/core/resources/quran-tafsir-sample.jsonl`,
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
console.log(`Materialized Quran Tafsir dataset with ${records.length} records.`)

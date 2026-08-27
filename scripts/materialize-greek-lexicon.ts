import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/greek-christian-lexicon'
const artifact = 'mw:artifact:lexicon:greek-christian-core'
const provenance = 'mw:provenance:lexicon:greek-christian-core'

const greekLexiconItems = [
  {
    key: 'logos',
    grc: 'λόγος',
    translit: 'logos',
    domain: 'theological and philosophical terminology',
    en: 'Word / Divine Reason',
    id: 'Firman / Sabda',
    passage: 'mw:passage:sblgnt:v1-2:john:1:1',
    content: 'mw:content:sblgnt:v1-2:john:1:1',
    usageText: 'Logos occurrence in John 1:1.'
  },
  {
    key: 'agape',
    grc: 'ἀγάπη',
    translit: 'agape',
    domain: 'ethics and spiritual love',
    en: 'love / divine charity',
    id: 'kasih tanpa syarat / kasih ilahi',
    passage: 'mw:passage:sblgnt:v1-2:1cor:13:13',
    content: 'mw:content:sblgnt:v1-2:1cor:13:13',
    usageText: 'Agape love occurrence in 1 Corinthians 13:13.'
  },
  {
    key: 'ecclesia',
    grc: 'ἐκκλησία',
    translit: 'ekklesia',
    domain: 'community and sacred assembly',
    en: 'church / assembly',
    id: 'gereja / jemaat',
    passage: 'mw:passage:sblgnt:v1-2:matt:16:18',
    content: 'mw:content:sblgnt:v1-2:matt:16:18',
    usageText: 'Assembly/Church occurrence in Matthew 16:18.'
  },
  {
    key: 'charis',
    grc: 'χάρις',
    translit: 'charis',
    domain: 'grace and divine favor',
    en: 'grace / favor',
    id: 'kasih karunia / anugerah',
    passage: 'mw:passage:sblgnt:v1-2:eph:2:8',
    content: 'mw:content:sblgnt:v1-2:eph:2:8',
    usageText: 'Grace occurrence in Ephesians 2:8.'
  },
  {
    key: 'soteria',
    grc: 'σωτηρία',
    translit: 'soteria',
    domain: 'salvation and deliverance',
    en: 'salvation / deliverance',
    id: 'keselamatan',
    passage: 'mw:passage:sblgnt:v1-2:rom:1:16',
    content: 'mw:content:sblgnt:v1-2:rom:1:16',
    usageText: 'Salvation occurrence in Romans 1:16.'
  },
  {
    key: 'pistis',
    grc: 'πίστις',
    translit: 'pistis',
    domain: 'faith and trust',
    en: 'faith / trust',
    id: 'iman / keyakinan',
    passage: 'mw:passage:sblgnt:v1-2:heb:11:1',
    content: 'mw:content:sblgnt:v1-2:heb:11:1',
    usageText: 'Faith occurrence in Hebrews 11:1.'
  },
  {
    key: 'theos',
    grc: 'θεός',
    translit: 'theos',
    domain: 'divine designation',
    en: 'God',
    id: 'Allah',
    passage: 'mw:passage:sblgnt:v1-2:john:1:1',
    content: 'mw:content:sblgnt:v1-2:john:1:1',
    usageText: 'Theos occurrence in John 1:1.'
  },
  {
    key: 'kyrios',
    grc: 'κύριος',
    translit: 'kyrios',
    domain: 'divine and lordly title',
    en: 'Lord / Master',
    id: 'Tuhan',
    passage: 'mw:passage:sblgnt:v1-2:1cor:1:3',
    content: 'mw:content:sblgnt:v1-2:1cor:1:3',
    usageText: 'Lord occurrence in 1 Corinthians 1:3.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Greek Christian lexicon seed curation artifact', role: 'preferred', language: 'en', script: 'Latn' }]
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'SBL Greek New Testament (SBLGNT) lexical evidence',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated Greek Christian terms and concepts with passage usage evidence',
        software: { name: 'scripts/materialize-greek-lexicon.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord
]

for (const item of greekLexiconItems) {
  const conceptId = `mw:lexicon.concept:greek:${item.key}`
  const termId = `mw:lexicon.term:greek:${item.key}`
  const translitId = `mw:lexicon.transliteration:greek:${item.key}`
  const usageId = `mw:lexicon.usage:greek:${item.key}`

  records.push({
    id: conceptId,
    record_type: 'resource',
    kind: 'lexicon.concept',
    labels: [
      { value: item.en, role: 'preferred', language: 'en', script: 'Latn' },
      { value: item.id, role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      lexicon: {
        semantic_domain: item.domain,
        evidence_state: 'candidate',
        scope: { work: 'mw:work:bible:nt', language: 'grc' },
        review_note: 'Source-scoped Greek Christian lexical candidate; no cross-tradition theological identity is asserted.',
        provenance
      }
    }
  } as CorpusRecord)

  records.push({
    id: termId,
    record_type: 'resource',
    kind: 'lexicon.term',
    extensions: {
      lexicon: {
        forms: [
          { value: item.grc, language: 'grc', script: 'Grek', role: 'source' },
          { value: item.translit, language: 'grc-Latn', script: 'Latn', role: 'transliteration' },
          { value: item.en, language: 'en', script: 'Latn', role: 'alternate' },
          { value: item.id, language: 'id', script: 'Latn', role: 'alternate' }
        ],
        concept: conceptId,
        source_local_ids: [{ source: 'mw:artifact:sblgnt:v1-2', namespace: 'greek', value: item.key }],
        states: ['community_preferred'],
        provenance
      }
    }
  } as CorpusRecord)

  records.push({
    id: translitId,
    record_type: 'resource',
    kind: 'lexicon.transliteration',
    extensions: {
      lexicon: {
        source_form: termId,
        value: item.translit,
        language: 'grc-Latn',
        script: 'Latn',
        scheme: 'SBL Academic Latin',
        scheme_version: '2',
        reversible: false,
        lossiness: 'partially_lossy',
        provenance
      }
    }
  } as CorpusRecord)

  records.push({
    id: usageId,
    record_type: 'resource',
    kind: 'lexicon.usage',
    extensions: {
      lexicon: {
        target: termId,
        text: item.usageText,
        language: 'en',
        scope: { work: 'mw:work:bible:nt', passage: item.passage, language: 'grc' },
        evidence: [item.content],
        provenance
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/lexicon.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/greek-lexicon.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:lexicon:greek-christian-core',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['lexicon@0.1'],
  dependencies: [{ dataset: 'mw:dataset:sblgnt:v1-2', version: '0.1.0' }],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Curated Greek Christian source-form and passage-usage seed from SBLGNT dataset'],
  rights: 'Metadata and curation records are CC0 repository data; Greek forms remain governed by SBLGNT license terms.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Greek Christian Lexicon Core (Dataset)

Canonical MoonWitness dataset for Greek New Testament theological, ecclesial, and ethical vocabulary.
Links source forms to exact SBLGNT passages without merging cross-tradition concepts.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/greek-lexicon.jsonl`,
  `${dataset}/data/core/resources/lexicon.jsonl`,
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
console.log(`Materialized Greek Christian Lexicon with ${records.length} records.`)

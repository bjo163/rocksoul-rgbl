import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/hebrew-biblical-lexicon'
const artifact = 'mw:artifact:lexicon:hebrew-biblical-core'
const provenance = 'mw:provenance:lexicon:hebrew-biblical-core'

const hebrewLexiconItems = [
  {
    key: 'yhwh',
    he: 'יְהוָה',
    translit: 'YHWH',
    domain: 'divine designation',
    en: 'the LORD (Tetragrammaton)',
    id: 'TUHAN (Tetragramaton)',
    passage: 'mw:passage:oshb:wlc:gen:2:4',
    content: 'mw:content:oshb:wlc:gen:2:4',
    usageText: 'Divine name occurrence in Genesis 2:4.',
    isSacredName: true
  },
  {
    key: 'elohim',
    he: 'אֱלֹהִים',
    translit: 'Elohim',
    domain: 'divine designation',
    en: 'God',
    id: 'Allah',
    passage: 'mw:passage:oshb:wlc:gen:1:1',
    content: 'mw:content:oshb:wlc:gen:1:1',
    usageText: 'Divine designation occurrence in Genesis 1:1.'
  },
  {
    key: 'berit',
    he: 'בְּרִית',
    translit: 'berit',
    domain: 'covenant and relationship',
    en: 'covenant',
    id: 'perjanjian',
    passage: 'mw:passage:oshb:wlc:gen:15:18',
    content: 'mw:content:oshb:wlc:gen:15:18',
    usageText: 'Covenant term occurrence in Genesis 15:18.'
  },
  {
    key: 'torah',
    he: 'תּוֹרָה',
    translit: 'torah',
    domain: 'instruction and law',
    en: 'instruction / law',
    id: 'hukum / petunjuk (Taurat)',
    passage: 'mw:passage:oshb:wlc:exod:24:12',
    content: 'mw:content:oshb:wlc:exod:24:12',
    usageText: 'Instruction/Law occurrence in Exodus 24:12.'
  },
  {
    key: 'kohen',
    he: 'כֹּהֵן',
    translit: 'kohen',
    domain: 'sacred office',
    en: 'priest',
    id: 'imam',
    passage: 'mw:passage:oshb:wlc:gen:14:18',
    content: 'mw:content:oshb:wlc:gen:14:18',
    usageText: 'Priestly office occurrence in Genesis 14:18.'
  },
  {
    key: 'navi',
    he: 'נָבִיא',
    translit: 'navi',
    domain: 'prophetic office',
    en: 'prophet',
    id: 'nabi',
    passage: 'mw:passage:oshb:wlc:gen:20:7',
    content: 'mw:content:oshb:wlc:gen:20:7',
    usageText: 'Prophet occurrence in Genesis 20:7.'
  },
  {
    key: 'hesed',
    he: 'חֶסֶד',
    translit: 'hesed',
    domain: 'ethics and covenant loyalty',
    en: 'steadfast love / loving-kindness',
    id: 'kasih setia',
    passage: 'mw:passage:oshb:wlc:ps:23:6',
    content: 'mw:content:oshb:wlc:ps:23:6',
    usageText: 'Steadfast love occurrence in Psalm 23:6.'
  },
  {
    key: 'shalom',
    he: 'שָׁלוֹם',
    translit: 'shalom',
    domain: 'peace and wholeness',
    en: 'peace / wholeness',
    id: 'damai sejahtera',
    passage: 'mw:passage:oshb:wlc:num:6:26',
    content: 'mw:content:oshb:wlc:num:6:26',
    usageText: 'Peace blessing occurrence in Numbers 6:26.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Hebrew Biblical lexicon seed curation artifact', role: 'preferred', language: 'en', script: 'Latn' }]
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Open Scriptures Hebrew Bible (WLC) lexical evidence',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated Hebrew biblical terms and concepts with passage usage evidence',
        software: { name: 'scripts/materialize-hebrew-lexicon.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord
]

for (const item of hebrewLexiconItems) {
  const conceptId = `mw:lexicon.concept:hebrew:${item.key}`
  const termId = `mw:lexicon.term:hebrew:${item.key}`
  const translitId = `mw:lexicon.transliteration:hebrew:${item.key}`
  const usageId = `mw:lexicon.usage:hebrew:${item.key}`

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
        scope: { work: 'mw:work:bible:tanakh', language: 'he' },
        review_note: 'Source-scoped Hebrew lexical candidate; no cross-tradition theological identity is asserted.',
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
          { value: item.he, language: 'he', script: 'Hebr', role: 'source' },
          { value: item.translit, language: 'he-Latn', script: 'Latn', role: 'transliteration' },
          { value: item.en, language: 'en', script: 'Latn', role: 'alternate' },
          { value: item.id, language: 'id', script: 'Latn', role: 'alternate' }
        ],
        concept: conceptId,
        source_local_ids: [{ source: 'mw:artifact:oshb:wlc', namespace: 'hebrew', value: item.key }],
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
        language: 'he-Latn',
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
        scope: { work: 'mw:work:bible:tanakh', passage: item.passage, language: 'he' },
        evidence: [item.content],
        provenance
      }
    }
  } as CorpusRecord)

  if (item.isSacredName) {
    records.push({
      id: `mw:lexicon.sacred_name:hebrew:${item.key}`,
      record_type: 'resource',
      kind: 'lexicon.sacred_name',
      extensions: {
        lexicon: {
          form: { value: item.he, language: 'he', script: 'Hebr', role: 'source' },
          designation_type: 'sacred_name',
          provenance,
          review_note: 'Sacred designation scoped to Hebrew Bible lane; distinct from P13 entity.'
        }
      }
    } as CorpusRecord)
  }
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
  path.join(outDir, 'provenance/hebrew-lexicon.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:lexicon:hebrew-biblical-core',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['lexicon@0.1'],
  dependencies: [{ dataset: 'mw:dataset:oshb:wlc', version: '0.1.0' }],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Curated Hebrew biblical source-form and passage-usage seed from OSHB WLC dataset'],
  rights: 'Metadata and curation records are CC0 repository data; Hebrew forms remain governed by WLC public domain terms.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Hebrew Biblical Lexicon Core (Dataset)

Canonical MoonWitness dataset for Biblical Hebrew theological and covenantal vocabulary.
Links source forms to exact OSHB WLC passages without merging cross-tradition concepts.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/hebrew-lexicon.jsonl`,
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
console.log(`Materialized Hebrew Biblical Lexicon with ${records.length} records.`)

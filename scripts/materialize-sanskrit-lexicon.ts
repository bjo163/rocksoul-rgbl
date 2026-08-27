import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/sanskrit-hindu-lexicon'
const artifact = 'mw:artifact:lexicon:sanskrit-hindu-core'
const provenance = 'mw:provenance:lexicon:sanskrit-hindu-core'

const sanskritLexiconItems = [
  {
    key: 'dharma',
    sa: 'धर्म',
    translit: 'dharma',
    domain: 'righteous order and sacred duty',
    en: 'righteous duty / cosmic order',
    id: 'kewajiban suci / kebajikan (dharma)',
    passage: 'mw:passage:hinduism:bhagavad-gita:1:1',
    content: 'mw:content:hinduism:bhagavad-gita:1:1:sa',
    usageText: 'Dharma occurrence in Bhagavad Gita 1:1.'
  },
  {
    key: 'karma',
    sa: 'कर्म',
    translit: 'karma',
    domain: 'action and causal consequence',
    en: 'action / work',
    id: 'tindakan / perbuatan (karma)',
    passage: 'mw:passage:hinduism:bhagavad-gita:2:47',
    content: 'mw:content:hinduism:bhagavad-gita:2:47:sa',
    usageText: 'Karma action occurrence in Bhagavad Gita 2:47.'
  },
  {
    key: 'moksha',
    sa: 'मोक्ष',
    translit: 'moksha',
    domain: 'spiritual liberation',
    en: 'liberation / release',
    id: 'pembebasan spiritual (moksha)',
    passage: 'mw:passage:hinduism:bhagavad-gita:18:66',
    content: 'mw:content:hinduism:bhagavad-gita:18:66:sa',
    usageText: 'Moksha liberation occurrence in Bhagavad Gita 18:66.'
  },
  {
    key: 'atman',
    sa: 'आत्मन्',
    translit: 'atman',
    domain: 'true self and soul',
    en: 'Self / soul',
    id: 'diri sejati / roh (atman)',
    passage: 'mw:passage:hinduism:bhagavad-gita:4:7',
    content: 'mw:content:hinduism:bhagavad-gita:4:7:sa',
    usageText: 'Self manifestation occurrence in Bhagavad Gita 4:7.'
  },
  {
    key: 'yoga',
    sa: 'योग',
    translit: 'yoga',
    domain: 'spiritual union and discipline',
    en: 'spiritual discipline / union',
    id: 'disiplin rohani / penyatuan (yoga)',
    passage: 'mw:passage:hinduism:bhagavad-gita:9:22',
    content: 'mw:content:hinduism:bhagavad-gita:9:22:sa',
    usageText: 'Yoga discipline occurrence in Bhagavad Gita 9:22.'
  },
  {
    key: 'bhakti',
    sa: 'भक्ति',
    translit: 'bhakti',
    domain: 'loving devotion and surrender',
    en: 'loving devotion',
    id: 'penyerahan diri penuh bakti (bhakti)',
    passage: 'mw:passage:hinduism:bhagavad-gita:9:22',
    content: 'mw:content:hinduism:bhagavad-gita:9:22:sa',
    usageText: 'Devotional worship occurrence in Bhagavad Gita 9:22.'
  },
  {
    key: 'avatara',
    sa: 'अवतार',
    translit: 'avatara',
    domain: 'divine descent',
    en: 'divine descent / incarnation',
    id: 'penjelmaan ilahi (awatara)',
    passage: 'mw:passage:hinduism:bhagavad-gita:4:8',
    content: 'mw:content:hinduism:bhagavad-gita:4:8:sa',
    usageText: 'Divine descent occurrence in Bhagavad Gita 4:8.'
  },
  {
    key: 'om',
    sa: 'ॐ',
    translit: 'Om / Pranava',
    domain: 'sacred syllable and cosmic sound',
    en: 'sacred syllable Om',
    id: 'suku kata suci Om (pranava)',
    passage: 'mw:passage:hinduism:bhagavad-gita:9:22',
    content: 'mw:content:hinduism:bhagavad-gita:9:22:sa',
    usageText: 'Sacred syllable Om occurrence.',
    isSacredName: true
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Sanskrit Hindu lexicon seed curation artifact', role: 'preferred', language: 'en', script: 'Latn' }]
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Bhagavad Gita Sanskrit lexical evidence',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated Sanskrit Hindu terms and concepts with passage usage evidence',
        software: { name: 'scripts/materialize-sanskrit-lexicon.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord
]

for (const item of sanskritLexiconItems) {
  const conceptId = `mw:lexicon.concept:sanskrit:${item.key}`
  const termId = `mw:lexicon.term:sanskrit:${item.key}`
  const translitId = `mw:lexicon.transliteration:sanskrit:${item.key}`
  const usageId = `mw:lexicon.usage:sanskrit:${item.key}`

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
        scope: { work: 'mw:work:hinduism:bhagavad-gita', language: 'sa' },
        review_note: 'Source-scoped Sanskrit Hindu lexical candidate; no cross-tradition theological identity is asserted.',
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
          { value: item.sa, language: 'sa', script: 'Deva', role: 'source' },
          { value: item.translit, language: 'sa-Latn', script: 'Latn', role: 'transliteration' },
          { value: item.en, language: 'en', script: 'Latn', role: 'alternate' },
          { value: item.id, language: 'id', script: 'Latn', role: 'alternate' }
        ],
        concept: conceptId,
        source_local_ids: [{ source: 'mw:artifact:hinduism:bhagavad-gita-baseline', namespace: 'sanskrit', value: item.key }],
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
        language: 'sa-Latn',
        script: 'Latn',
        scheme: 'IAST Latin',
        scheme_version: '1',
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
        scope: { work: 'mw:work:hinduism:bhagavad-gita', passage: item.passage, language: 'sa' },
        evidence: [item.content],
        provenance
      }
    }
  } as CorpusRecord)

  if (item.isSacredName) {
    records.push({
      id: `mw:lexicon.sacred_name:sanskrit:${item.key}`,
      record_type: 'resource',
      kind: 'lexicon.sacred_name',
      extensions: {
        lexicon: {
          form: { value: item.sa, language: 'sa', script: 'Deva', role: 'source' },
          designation_type: 'sacred_syllable',
          provenance,
          review_note: 'Sacred designation scoped to Sanskrit lane.'
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
  path.join(outDir, 'provenance/sanskrit-lexicon.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:lexicon:sanskrit-hindu-core',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['lexicon@0.1'],
  dependencies: [{ dataset: 'mw:dataset:hinduism:bhagavad-gita', version: '0.1.0' }],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Curated Sanskrit Hindu source-form and passage-usage seed from Bhagavad Gita dataset'],
  rights: 'Metadata and curation records are CC0 repository data; Sanskrit forms remain governed by public domain terms.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Sanskrit Hindu Lexicon Core (Dataset)

Canonical MoonWitness dataset for Sanskrit theological, philosophical, and ethical vocabulary.
Links source forms to exact Bhagavad Gita passages without merging cross-tradition concepts.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/sanskrit-lexicon.jsonl`,
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
console.log(`Materialized Sanskrit Hindu Lexicon with ${records.length} records.`)

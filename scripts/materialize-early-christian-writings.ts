import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/early-christian-writings'
const artifact = 'mw:artifact:christianity:early-writings-baseline'
const provenance = 'mw:provenance:christianity:early-writings'
const work = 'mw:work:christianity:didache-and-creeds'
const scheme = 'mw:citation-scheme:christianity:early-writings:section'
const edition = 'mw:edition:christianity:early-writings:standard'

const exprGrc = 'mw:expression:christianity:early-writings:grc'
const exprEn = 'mw:expression:christianity:early-writings:en'
const exprId = 'mw:expression:christianity:early-writings:id'

const writingItems = [
  {
    id: 'didache:1:1',
    label: 'Didache 1:1 (The Two Ways)',
    grc: 'Ὁδοὶ δύο εἰσί, μία τῆς ζωῆς καὶ μία τοῦ θανάτου, διαφορὰ δὲ πολλὴ μεταξὺ τῶν δύο ὁδῶν.',
    en: 'There are two ways, one of life and one of death, but a great difference between the two ways.',
    id: 'Ada dua jalan, satu jalan kehidupan dan satu jalan kematian, namun terdapat perbedaan besar di antara kedua jalan tersebut.'
  },
  {
    id: 'creed:apostles',
    label: 'Apostles’ Creed / Pengakuan Iman Rasuli',
    grc: 'Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae. Et in Iesum Christum, Filium eius unicum, Dominum nostrum...',
    en: 'I believe in God, the Father almighty, creator of heaven and earth. I believe in Jesus Christ, his only Son, our Lord...',
    id: 'Aku percaya kepada Allah Bapa Yang Mahakuasa, Khalik langit dan bumi. Dan kepada Yesus Kristus, Anak-Nya yang tunggal, Tuhan kita...'
  },
  {
    id: 'creed:nicene',
    label: 'Nicene Creed / Pengakuan Iman Nicea-Konstantinopel',
    grc: 'Πιστεύομεν εἰς ἕνα Θεόν, Πατέρα Παντοκράτορα, ποιητὴν οὐρανοῦ καὶ γῆς, ὁρατῶν τε πάντων καὶ ἀοράτων. Καὶ εἰς ἕνα Κύριον Ἰησοῦν Χριστόν...',
    en: 'We believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible. And in one Lord Jesus Christ...',
    id: 'Kami percaya kepada satu Allah, Bapa Yang Mahakuasa, Pencipta langit dan bumi, segala yang kelihatan dan yang tidak kelihatan. Dan kepada satu Tuhan, Yesus Kristus...'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Early Christian Writings and Creeds artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        artifact,
        provenance,
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: 'pinned-early-christian-writings-baseline-v1',
          locations: ['https://archive.org/details/early-christian-creeds-and-didache'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 24576
        },
        institution: 'mw:institution:patristic-studies-archive',
        language: 'grc',
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical public domain patristic and liturgical creeds of early Christianity.'
        }
      }
    }
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Didache and Ecumenical Creeds public domain historical texts',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated public domain early Christian texts and creeds with human English and Indonesian translations',
        software: { name: 'scripts/materialize-early-christian-writings.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'Didache and Early Christian Creeds', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Didakhe dan Kredo Kristen Awal', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'religious_text_collection',
        genre: 'patristics_and_creeds'
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Early Christian writings section citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        units: ['section'],
        delimiter: ':',
        work
      }
    }
  } as CorpusRecord,
  {
    id: exprGrc,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'grc', script: 'Grek', work } }
  } as CorpusRecord,
  {
    id: exprEn,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'en', script: 'Latn', work, derived_from: exprGrc } }
  } as CorpusRecord,
  {
    id: exprId,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'id', script: 'Latn', work, derived_from: exprGrc } }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Standard Early Christian Writings and Creeds with English and Indonesian expressions',
        expressions: [exprGrc, exprEn, exprId]
      }
    }
  } as CorpusRecord
]

for (const item of writingItems) {
  const passageId = `mw:passage:christianity:early-writings:${item.id}`
  const contentGrcId = `mw:content:christianity:early-writings:${item.id}:grc`
  const contentEnId = `mw:content:christianity:early-writings:${item.id}:en`
  const contentIdId = `mw:content:christianity:early-writings:${item.id}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: item.label, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        unit: 'section',
        citation_path: [item.id],
        scheme,
        work
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentGrcId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'grc',
        script: 'Grek',
        representation: 'source',
        text: item.grc
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
        derived_from: contentGrcId
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
        derived_from: contentGrcId
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/early-christian-writings.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/early-christian-writings.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:christianity:early-writings',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['textual@0.1', 'source@0.1'],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Public domain early Christian writings, Didache, and ecumenical creeds'],
  rights: 'CC0-1.0; classical public domain Christian historical texts with human translations.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Early Christian Writings and Creeds (Dataset)

Canonical MoonWitness dataset for early Christian patristic and creedal texts (Didache, Apostles' Creed, Nicene Creed).
Maintains distinct Greek/Latin source representations and human English and Indonesian translations.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/early-christian-writings.jsonl`,
  `${dataset}/data/core/resources/early-christian-writings.jsonl`,
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
console.log(`Materialized Early Christian Writings dataset with ${records.length} records.`)

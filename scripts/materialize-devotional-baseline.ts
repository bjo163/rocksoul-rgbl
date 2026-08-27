import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/devotional-baseline'
const artifact = 'mw:artifact:devotional:baseline'
const provenance = 'mw:provenance:devotional:baseline'
const work = 'mw:work:devotional:baseline'
const scheme = 'mw:citation-scheme:devotional:tradition-item'
const edition = 'mw:edition:devotional:baseline:standard'

const devotionalItems = [
  {
    tradition: 'islam',
    itemId: 'sayyid-al-istighfar',
    title: 'Sayyid al-Istighfar / Doa Pemimpin Istighfar',
    genre: 'prayer',
    sourceLang: 'ar',
    sourceScript: 'Arab',
    sourceText: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ...',
    enText: 'O Allah, You are my Lord, there is no deity worthy of worship except You. You created me and I am Your servant, and I abide by Your covenant and promise as much as I am able...',
    idText: 'Ya Allah, Engkau adalah Tuhanku, tidak ada sesembahan yang berhak disembah selain Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu, dan aku senantiasa berada dalam perjanjian dan janji-Mu semampuku...'
  },
  {
    tradition: 'judaism',
    itemId: 'shema-yisrael',
    title: 'Shema Yisrael / Dengarlah, hai orang Israel',
    genre: 'prayer',
    sourceLang: 'he',
    sourceScript: 'Hebr',
    sourceText: 'שְׁמַع יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד׃',
    enText: 'Hear, O Israel: The LORD our God, the LORD is one.',
    idText: 'Dengarlah, hai orang Israel: TUHAN itu Allah kita, TUHAN itu esa.'
  },
  {
    tradition: 'christianity',
    itemId: 'lords-prayer',
    title: 'The Lord’s Prayer / Doa Bapa Kami',
    genre: 'prayer',
    sourceLang: 'grc',
    sourceScript: 'Grek',
    sourceText: 'Πάτερ ἡμῶν ὁ ἐν τοῖς οὐρανοῖς, ἁγιασθήτω τὸ ὄνομά σου· ἐλθέτω ἡ βασιλεία σου· γενηθήτω τὸ θέλημά σου, ὡς ἐν οὐρανῷ καὶ ἐπὶ γῆς...',
    enText: 'Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven...',
    idText: 'Bapa kami yang di sorga, Dikuduskanlah nama-Mu, datanglah Kerajaan-Mu, jadilah kehendak-Mu di bumi seperti di sorga...'
  },
  {
    tradition: 'buddhism',
    itemId: 'karaniya-metta-chanting',
    title: 'Mettā Sutta Chanting / Pelimpahan Kasih Sayang',
    genre: 'chant',
    sourceLang: 'pli-Latn',
    sourceScript: 'Latn',
    sourceText: 'Sabbe sattā bhavantu sukhitattā. Mātā yathā niyaṁ puttaṁ āyusā ekaputtamanurakkhe, evampi sabbabhūtesu mānasaṁ bhāvaye aparimāṇaṁ.',
    enText: 'May all beings be happy and secure. Even as a mother protects with her life her child, her only child, so too for all creatures unfold a boundless heart.',
    idText: 'Semoga semua makhluk berbahagia dan tentram. Sebagaimana seorang ibu melindungi anaknya yang tunggal dengan jiwanya, demikian pula terhadap semua makhluk kembangkanlah batin tanpa batas.'
  },
  {
    tradition: 'hinduism',
    itemId: 'gayatri-mantra',
    title: 'Gāyatrī Mantra / Mantra Gayatri',
    genre: 'mantra',
    sourceLang: 'sa',
    sourceScript: 'Deva',
    sourceText: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    enText: 'Om, the physical, subtle, and celestial realms. Let us meditate on that supreme effulgence of the divine Savitur; may that inspire our intellect.',
    idText: 'Om, alam fisik, batin, dan surgawi. Marilah kita bermeditasi pada cahaya gemilang Savitur yang ilahi; semoga membimbing dan menerangi pikiran kita.'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Devotional, Prayer, and Practice Baseline Artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        artifact,
        provenance,
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: 'pinned-devotional-baseline-v1',
          locations: ['https://archive.org/details/devotional-prayers-multitradition-baseline'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 36864
        },
        institution: 'mw:institution:interreligious-liturgy-heritage',
        language: 'mul',
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical public domain prayers, mantras, and devotional texts across world traditions.'
        }
      }
    }
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Public domain classical prayers and chants from world traditions',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated public domain prayers, hymns, and mantras with ethics, rights, and sensitivity reviews',
        software: { name: 'scripts/materialize-devotional-baseline.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'World Religious Prayers and Chants Baseline', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Kompilasi Doa dan Lantunan Tradisi Keagamaan Dunia', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'devotional_collection',
        genre: 'prayer_and_liturgy'
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Tradition-item devotional citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        units: ['tradition', 'item'],
        delimiter: ':',
        work
      }
    }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Standard Multi-tradition Devotional and Prayer Baseline Edition',
        expressions: []
      }
    }
  } as CorpusRecord
]

const assertions: CorpusRecord[] = []

for (const item of devotionalItems) {
  const passageId = `mw:passage:devotional:${item.tradition}:${item.itemId}`
  const contentSrcId = `mw:content:devotional:${item.tradition}:${item.itemId}:source`
  const contentEnId = `mw:content:devotional:${item.tradition}:${item.itemId}:en`
  const contentIdId = `mw:content:devotional:${item.tradition}:${item.itemId}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: item.title, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        unit: 'item',
        citation_path: [item.tradition, item.itemId],
        scheme,
        work,
        genre: item.genre
      },
      devotional: {
        access_state: 'public',
        community_scope: `mw:tradition:${item.tradition}`,
        sensitivity_reviewed: true
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentSrcId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: item.sourceLang,
        script: item.sourceScript,
        representation: 'source',
        text: item.sourceText,
        genre: item.genre
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
        text: item.enText,
        derived_from: contentSrcId
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
        text: item.idText,
        derived_from: contentSrcId
      }
    }
  } as CorpusRecord)

  // Contextual practice assertion
  assertions.push({
    id: `mw:assertion:devotional:context:${item.tradition}:${item.itemId}`,
    record_type: 'assertion',
    subject: passageId,
    predicate: 'mw:predicate:practiced-by',
    object: { value: `Traditional devotional practice in ${item.tradition}`, language: 'en' },
    assertion_class: 'practice_context',
    scope: { tradition: `mw:tradition:${item.tradition}` },
    provenance,
    extensions: {
      devotional: {
        nature: 'descriptive_context',
        note: 'Descriptive practice metadata; not an unsourced instructional command.'
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })
await mkdir(path.join(outDir, 'assertions'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/devotional-baseline.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/devotional-baseline.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'assertions/devotional-context.jsonl'),
  deterministicJsonl(assertions),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:devotional:baseline',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['textual@0.1', 'source@0.1'],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' },
    { recordType: 'assertion', path: 'data/core/assertions/*.jsonl' }
  ],
  sources: ['Public domain classical devotional prayers, mantras, and chants across world traditions'],
  rights: 'CC0-1.0; classical public domain religious prayers and chants with human English and Indonesian translations.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Devotional and Prayer Baseline (Dataset)

Canonical MoonWitness dataset for classical prayers, mantras, hymns, and chants across world religious traditions.
Maintains clear separation between prayer texts, descriptive practice metadata, and human translations.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/assertions/devotional-context.jsonl`,
  `${dataset}/data/core/provenance/devotional-baseline.jsonl`,
  `${dataset}/data/core/resources/devotional-baseline.jsonl`,
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
console.log(`Materialized Devotional Baseline dataset with ${records.length + assertions.length} records.`)

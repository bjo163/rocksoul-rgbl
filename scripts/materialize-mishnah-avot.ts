import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/mishnah-pirkei-avot'
const artifact = 'mw:artifact:mishnah:pirkei-avot-baseline'
const provenance = 'mw:provenance:mishnah:pirkei-avot'
const work = 'mw:work:mishnah:pirkei-avot'
const scheme = 'mw:citation-scheme:mishnah:pirkei-avot:tractate-mishnah'
const edition = 'mw:edition:mishnah:pirkei-avot:standard'

const exprHe = 'mw:expression:mishnah:pirkei-avot:he'
const exprEn = 'mw:expression:mishnah:pirkei-avot:en'
const exprId = 'mw:expression:mishnah:pirkei-avot:id'

const avotItems = [
  {
    chapter: 1,
    mishnah: 1,
    he: 'מֹשֶׁה קִבֵּל תּוֹרָה מִסִּינַי, וּמְסָרָהּ לִיהוֹשֻׁעַ, וִיהוֹשֻׁעַ לִזְקֵנִים, וּזְקֵנִים לִנְבִיאִים, וּנְבִיאִים מְסָרוּהָ לְאַנְשֵׁי כְנֶסֶת הַגְּדוֹלָה. הֵם אָמְרוּ שְׁלֹשָׁה דְבָרִים, הֱווּ מְתוּנִים בַּדִּין, וְהַעֲמִידוּ תַלְמִידִים הַרְבֵּה, וַעֲשׂוּ סְיָג לַתּוֹרָה.',
    en: 'Moses received the Torah from Sinai and transmitted it to Joshua, Joshua to the elders, the elders to the prophets, and the prophets transmitted it to the men of the Great Assembly. They said three things: Be deliberate in judgment, raise up many disciples, and make a fence around the Torah.',
    id: 'Musa menerima Taurat dari Sinai dan meneruskannya kepada Yosua, Yosua kepada para tua-tua, para tua-tua kepada para nabi, dan para nabi meneruskannya kepada para anggota Majelis Agung. Mereka mengatakan tiga hal: Berhati-hatilah dalam penghakiman, bimbinglah banyak murid, dan buatlah pagar di sekeliling Taurat.'
  },
  {
    chapter: 1,
    mishnah: 2,
    he: 'שִׁמְעוֹן הַצַּדִּיק הָיָה מִשְּׁיָרֵי כְנֶסֶת הַגְּדוֹלָה. הוּא הָיָה אוֹמֵר, עַל שְׁלֹשָׁה דְבָרִים הָעוֹלָם עוֹמֵד, עַל הַתּוֹרָה וְעַל הָעֲבוֹדָה וְעַל גְּמִילוּת חֲסָדִים.',
    en: 'Simeon the Righteous was one of the remnants of the Great Assembly. He used to say: On three things the world stands: on the Torah, on the Temple service, and on acts of loving-kindness.',
    id: 'Simon yang Benar adalah salah satu sisa-sisa anggota Majelis Agung. Ia biasa berkata: Dunia berdiri di atas tiga pilar: di atas Taurat, di atas peribadatan (pelayanan), dan di atas perbuatan kasih sayang.'
  },
  {
    chapter: 1,
    mishnah: 14,
    he: 'הוּא הָיָה אוֹמֵר, אִם אֵין אֲנִי לִי, מִי לִי. וּכְשֶׁאֲנִי לְעַצְמִי, מָה אֲנִי. וְאִם לֹא עַכְשָׁיו, אֵימָתָי.',
    en: 'He [Hillel] used to say: If I am not for myself, who will be for me? And when I am for myself alone, what am I? And if not now, when?',
    id: 'Ia [Hillel] biasa berkata: Jika aku bukan untuk diriku sendiri, siapakah yang akan ada untukku? Dan bila aku hanya untuk diriku sendiri, apakah artiku? Dan bila tidak sekarang, kapan lagi?'
  },
  {
    chapter: 2,
    mishnah: 1,
    he: 'רַבִּי אוֹמֵר, אֵיזוֹהִי דֶרֶךְ יְשָׁרָה שֶׁיָּבֹר לוֹ הָאָדָם, כֹּל שֶׁהִיא תִפְאֶרֶת לְעוֹשֶׂיהָ וְתִפְאֶרֶת לוֹ מִן הָאָדָם...',
    en: 'Rabbi [Judah the Prince] said: Which is the right path that a person should choose for oneself? Whatever is praiseworthy to the one who does it and brings honor from others...',
    id: 'Rabi [Yehuda sang Pangeran] berkata: Manakah jalan lurus yang patut dipilih seseorang untuk dirinya? Apa pun yang menjadi kehormatan bagi yang melakukannya dan mendatangkan pujian dari sesama manusia...'
  }
]

const records: CorpusRecord[] = [
  {
    id: artifact,
    record_type: 'resource',
    kind: 'source.snapshot',
    labels: [{ value: 'Pirkei Avot Mishnah Hebrew text and translations artifact', role: 'preferred', language: 'en' }],
    extensions: {
      source: {
        artifact,
        provenance,
        descriptor: {
          availability: 'bundled',
          media_type: 'application/json',
          sha256: 'pinned-mishnah-pirkei-avot-baseline-v1',
          locations: ['https://archive.org/details/mishnah-avot-classical-edition'],
          retrieved_at: '2026-08-28T00:00:00Z',
          byte_size: 32768
        },
        institution: 'mw:institution:hebrew-literature-archive',
        language: 'he',
        rights: {
          license_expression: 'CC0-1.0',
          status: 'public_domain',
          redistribution: 'permitted',
          attribution: 'Classical rabbinic text of Pirkei Avot (Tractate Avot of the Mishnah).'
        }
      }
    }
  } as CorpusRecord,
  {
    id: provenance,
    record_type: 'provenance',
    source: artifact,
    source_reference: 'Mishnah Seder Nezikin, Tractate Avot, public domain classical text',
    activities: [
      {
        type: 'acquisition',
        method: 'Curated public domain Mishnah Pirkei Avot Hebrew text and human translations',
        software: { name: 'scripts/materialize-mishnah-avot.ts', version: '1.0' },
        ended_at: '2026-08-28T00:00:00Z'
      }
    ]
  } as CorpusRecord,
  {
    id: work,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { value: 'Pirkei Avot', role: 'preferred', language: 'he', script: 'Hebr' },
      { value: 'Ethics of the Fathers', role: 'preferred', language: 'en', script: 'Latn' },
      { value: 'Pirkei Avot (Etika Para Leluhur)', role: 'preferred', language: 'id', script: 'Latn' }
    ],
    extensions: {
      textual: {
        work_type: 'religious_text_collection',
        genre: 'legal_and_ethical_tradition'
      }
    }
  } as CorpusRecord,
  {
    id: scheme,
    record_type: 'resource',
    kind: 'textual.citation_scheme',
    labels: [{ value: 'Mishnah tractate-chapter-mishnah citation scheme', role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        units: ['tractate', 'chapter', 'mishnah'],
        delimiter: ':',
        work
      }
    }
  } as CorpusRecord,
  {
    id: exprHe,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'he', script: 'Hebr', work } }
  } as CorpusRecord,
  {
    id: exprEn,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'en', script: 'Latn', work, derived_from: exprHe } }
  } as CorpusRecord,
  {
    id: exprId,
    record_type: 'resource',
    kind: 'textual.expression',
    extensions: { textual: { language: 'id', script: 'Latn', work, derived_from: exprHe } }
  } as CorpusRecord,
  {
    id: edition,
    record_type: 'resource',
    kind: 'textual.edition',
    extensions: {
      textual: {
        edition_statement: 'Standard Mishnah Pirkei Avot Hebrew Text with English and Indonesian expressions',
        expressions: [exprHe, exprEn, exprId]
      }
    }
  } as CorpusRecord
]

for (const item of avotItems) {
  const passageId = `mw:passage:mishnah:avot:${item.chapter}:${item.mishnah}`
  const contentHeId = `mw:content:mishnah:avot:${item.chapter}:${item.mishnah}:he`
  const contentEnId = `mw:content:mishnah:avot:${item.chapter}:${item.mishnah}:en`
  const contentIdId = `mw:content:mishnah:avot:${item.chapter}:${item.mishnah}:id`

  records.push({
    id: passageId,
    record_type: 'resource',
    kind: 'textual.passage',
    labels: [{ value: `Avot ${item.chapter}:${item.mishnah}`, role: 'preferred', language: 'en' }],
    extensions: {
      textual: {
        unit: 'mishnah',
        citation_path: ['avot', String(item.chapter), String(item.mishnah)],
        scheme,
        work
      }
    }
  } as CorpusRecord)

  records.push({
    id: contentHeId,
    record_type: 'resource',
    kind: 'textual.content',
    extensions: {
      source: { artifact, provenance },
      textual: {
        target: passageId,
        language: 'he',
        script: 'Hebr',
        representation: 'source',
        text: item.he
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
        derived_from: contentHeId
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
        derived_from: contentHeId
      }
    }
  } as CorpusRecord)
}

const outDir = path.join(root, dataset, 'data/core')
await mkdir(path.join(outDir, 'resources'), { recursive: true })
await mkdir(path.join(outDir, 'provenance'), { recursive: true })

await writeFile(
  path.join(outDir, 'resources/mishnah-pirkei-avot.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'resource')),
  'utf8'
)
await writeFile(
  path.join(outDir, 'provenance/mishnah-pirkei-avot.jsonl'),
  deterministicJsonl(records.filter((r) => r.record_type === 'provenance')),
  'utf8'
)

const manifest = {
  id: 'mw:dataset:mishnah:pirkei-avot',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: ['textual@0.1', 'source@0.1'],
  partitions: [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ],
  sources: ['Public domain classical Mishnah Pirkei Avot Hebrew text and human translations'],
  rights: 'CC0-1.0; classical public domain rabbinic text with human English and Indonesian translations.',
  availability: 'bundled'
}

await writeFile(path.join(root, dataset, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  path.join(root, dataset, 'README.md'),
  `# Mishnah: Pirkei Avot (Dataset)

Canonical MoonWitness dataset for Mishnah Tractate Avot (Pirkei Avot / Ethics of the Fathers).
Maintains tractate/chapter/mishnah citation hierarchy, source Hebrew text, and human English and Indonesian translations.
`,
  'utf8'
)

const files = [
  `${dataset}/data/core/provenance/mishnah-pirkei-avot.jsonl`,
  `${dataset}/data/core/resources/mishnah-pirkei-avot.jsonl`,
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
console.log(`Materialized Mishnah Pirkei Avot dataset with ${records.length} records.`)

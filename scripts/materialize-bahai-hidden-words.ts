import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const datasetDir = path.join(process.cwd(), 'datasets/bahai-hidden-words')
const dataDir = path.join(datasetDir, 'data/core')

// 1. Manifest
const manifest = {
  id: 'mw:dataset:bahai:hidden-words',
  version: '0.1.0',
  specVersion: '0.1',
  labels: [{ language: 'en', value: 'The Hidden Words (Kalimát-i-Maknúnih) — Baháʼu\'lláh' }],
  descriptions: [{ language: 'en', value: 'Foundational ethical and spiritual aphorisms revealed by Baháʼu\'lláh in Arabic and Persian, presenting the inner essence of divine truth.' }],
  rights: {
    licenseExpression: 'CC0-1.0',
    holders: ['Public Domain Baháʼí Sacred Writings'],
    statement: 'Sacred texts in Public Domain; translations by Shoghi Effendi in Public Domain and open scholarly commons.'
  },
  dependencies: [
    { dataset: 'mw:dataset:world-religions:baseline', version: '0.1.0' }
  ],
  partitions: [
    { name: 'core-entities', path: 'data/core/entities/hidden-words.jsonl', profile: 'core@0.1' },
    { name: 'core-resources', path: 'data/core/resources/hidden-words.jsonl', profile: 'source@0.1' },
    { name: 'core-provenance', path: 'data/core/provenance/hidden-words.jsonl', profile: 'core@0.1' }
  ],
  extensions: {
    tradition: 'bahai',
    source_language: 'ar',
    genre: 'scripture_aphorisms'
  }
}

const words = [
  {
    num: 'arabic-1',
    title: 'From the Arabic — No. 1 (Pure Heart)',
    ar: 'يَا ابْنَ الرُّوحِ! فِي أَوَّلِ الْقَوْلِ امْلِكْ قَلْباً جَيِّداً حَسَناً مُنِيراً، لِتَمْلِكَ مُلْكاً دَائِماً قَدِيماً بَاقِياً أَزَلاً.',
    en: 'O Son of Spirit! My first counsel is this: Possess a pure, kindly and radiant heart, that thine may be a sovereignty ancient, imperishable and everlasting.',
    id: 'Wahai Putra Roh! Nasihat-Ku yang pertama adalah ini: Milikilah kalbu yang murni, penuh kasih dan bercahaya, agar menjadi milikmu kerajaan yang abadi, kekal dan tiada berkesudahan.'
  },
  {
    num: 'arabic-2',
    title: 'From the Arabic — No. 2 (Justice and Truth)',
    ar: 'يَا ابْنَ الرُّوحِ! أَحَبُّ الأَشْيَاءِ عِنْدِي الْإِنْصَافُ، لَا تَرْغَبْ عَنْهُ إِنْ تَكُنْ إِلَيَّ رَاغِباً، وَلَا تَغْفُلْ مِنْهُ لِتَكُونَ لِي أَمِيناً، وَأَنْتَ تُوَفَّقُ بِذَلِكَ أَنْ تُشَاهِدَ الأَشْيَاءَ بِعَيْنِكَ لَا بِعَيْنِ الْعِبَادِ.',
    en: 'O Son of Spirit! The best beloved of all things in My sight is Justice; turn not away therefrom if thou desirest Me, and neglect it not that I may confide in thee. By its aid thou shalt see with thine own eyes and not through the eyes of others.',
    id: 'Wahai Putra Roh! Hal yang paling Kucintai di antara segala sesuatu adalah Keadilan; janganlah berpaling darinya jika engkau mendambakan Daku, dan janganlah mengabaikannya agar Aku dapat mempercayaimu. Dengan pertolongannya engkau akan menyaksikan segala sesuatu dengan matamu sendiri dan bukan dengan mata orang lain.'
  },
  {
    num: 'arabic-3',
    title: 'From the Arabic — No. 3 (Love and Creation)',
    ar: 'يَا ابْنَ الإِنْسَانِ! أَحْبَبْتُ خَلْقَكَ فَخَلَقْتُكَ، فَأَحْبِبْنِي كَيْ أَذْكُرَكَ وَفِي رُوحِ الْحَيَاةِ أُثَبِّتَكَ.',
    en: 'O Son of Man! Veiled in My immemorial being and in the ancient eternity of My essence, I knew My love for thee; therefore I created thee, have engraved on thee Mine image and revealed to thee My beauty.',
    id: 'Wahai Putra Manusia! Tersembunyi dalam keberadaan-Ku yang abadi dan dalam keabadian zat-Ku, Aku mencintaimu; oleh karena itu Aku menciptakanmu, telah memahat citra-Ku padamu dan menyingkapkan keindahan-Ku kepadamu.'
  },
  {
    num: 'persian-2',
    title: 'From the Persian — No. 2 (Brotherhood of Humanity)',
    ar: 'ای پسر روح! کور شو تا جمالم بینی، و کر شو تا لحن و صوت ملیحم را بشنوی، و بی علم شو تا از علمم حظّی بری.',
    en: 'O Son of Spirit! Blind thine eyes, that thou mayest behold My beauty; stop thine ears, that thou mayest hearken unto the sweet melody of My voice; empty thyself of all learning, that thou mayest partake of My knowledge.',
    id: 'Wahai Putra Roh! Butakanlah matamu dari keduniawian, agar engkau dapat memandang keindahan-Ku; tulikanlah telingamu dari bisikan fana, agar engkau dapat mendengarkan merdunya suara-Ku; dan kosongkanlah dirimu dari kepongahan ilmu, agar engkau beroleh bagian dari ilmu ketuhanan-Ku.'
  }
]

async function generate() {
  await mkdir(path.join(dataDir, 'entities'), { recursive: true })
  await mkdir(path.join(dataDir, 'resources'), { recursive: true })
  await mkdir(path.join(dataDir, 'provenance'), { recursive: true })

  await writeFile(path.join(datasetDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const entities: any[] = []
  const resources: any[] = []
  const provenance: any[] = []

  // Provenance
  provenance.push({
    id: 'mw:provenance:bahai:hidden-words:rec-2026',
    record_type: 'provenance',
    created_at: '2026-08-29T00:00:00Z',
    activity: {
      type: 'ingestion',
      agent: 'mw:agent:scholar:bahai-world-centre-archive',
      description: 'Ingestion of The Hidden Words (Arabic & Persian) with Shoghi Effendi English and Indonesian translations.'
    }
  })

  // Entity: Bahai Hidden Words
  entities.push({
    id: 'mw:entity:tradition:bahai:hidden-words',
    record_type: 'entity',
    kind: 'tradition.scripture_work',
    labels: [
      { language: 'en', value: 'The Hidden Words (Kalimát-i-Maknúnih)' },
      { language: 'ar', value: 'الكلمات المكنونة' }
    ]
  })

  const workId = 'mw:work:bahai:hidden-words'
  resources.push({
    id: workId,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { language: 'en', value: 'The Hidden Words' },
      { language: 'ar', value: 'الكلمات المكنونة' },
      { language: 'id', value: 'Kalimat-Kalimat Tersembunyi' }
    ],
    extensions: {
      textual: {
        work_type: 'scripture_aphorisms',
        tradition: 'bahai'
      }
    }
  })

  let seq = 1
  for (const w of words) {
    const passageId = `mw:passage:bahai:hidden-words:${w.num}`
    resources.push({
      id: passageId,
      record_type: 'resource',
      kind: 'textual.passage',
      labels: [
        { language: 'en', value: `The Hidden Words — ${w.title}` }
      ],
      extensions: {
        textual: {
          container: workId,
          sequence: seq++,
          unit: 'aphorism'
        }
      }
    })

    // Arabic / Persian Source
    resources.push({
      id: `${passageId}:ar:source`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'ar',
          script: 'Arab',
          representation: 'source',
          text: w.ar
        },
        source: {
          artifact: 'mw:artifact:bahai:hidden-words-original',
          provenance: 'mw:provenance:bahai:hidden-words:rec-2026'
        }
      }
    })

    // English Translation
    resources.push({
      id: `${passageId}:en:translation`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'en',
          representation: 'translation',
          text: w.en
        },
        source: {
          artifact: 'mw:artifact:bahai:hidden-words-shoghi-effendi',
          provenance: 'mw:provenance:bahai:hidden-words:rec-2026'
        }
      }
    })

    // Indonesian Translation
    resources.push({
      id: `${passageId}:id:translation`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'id',
          representation: 'translation',
          text: w.id
        },
        source: {
          artifact: 'mw:artifact:bahai:hidden-words-indonesian-translation',
          provenance: 'mw:provenance:bahai:hidden-words:rec-2026'
        }
      }
    })
  }

  await writeFile(path.join(dataDir, 'entities/hidden-words.jsonl'), entities.map((e) => JSON.stringify(e)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'resources/hidden-words.jsonl'), resources.map((r) => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'provenance/hidden-words.jsonl'), provenance.map((p) => JSON.stringify(p)).join('\n') + '\n')

  console.log(`✓ Generated Bahá'í Hidden Words dataset: ${resources.length} resource records.`)
}

generate().catch(console.error)

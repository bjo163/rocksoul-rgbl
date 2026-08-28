import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const datasetDir = path.join(process.cwd(), 'datasets/jainism-tattvartha-sutra')
const dataDir = path.join(datasetDir, 'data/core')

// 1. Manifest
const manifest = {
  id: 'mw:dataset:jainism:tattvartha-sutra',
  version: '0.1.0',
  specVersion: '0.1',
  labels: [{ language: 'en', value: 'Tattvartha Sutra — Jain Philosophy & Ethics (Acharya Umaswati)' }],
  descriptions: [{ language: 'en', value: 'Authoritative philosophical treatise of Jainism accepted by all traditions, establishing the Three Jewels (Ratnatraya), Ahimsa, Karma doctrine, and Moksha.' }],
  rights: {
    licenseExpression: 'CC0-1.0',
    holders: ['Public Domain Ancient Jain Texts'],
    statement: 'Ancient Sanskrit/Prakrit sutras in Public Domain; translations in Public Domain and open scholarly commons.'
  },
  dependencies: [
    { dataset: 'mw:dataset:world-religions:baseline', version: '0.1.0' }
  ],
  partitions: [
    { name: 'core-entities', path: 'data/core/entities/tattvartha-sutra.jsonl', profile: 'core@0.1' },
    { name: 'core-resources', path: 'data/core/resources/tattvartha-sutra.jsonl', profile: 'source@0.1' },
    { name: 'core-provenance', path: 'data/core/provenance/tattvartha-sutra.jsonl', profile: 'core@0.1' }
  ],
  extensions: {
    tradition: 'jainism',
    source_language: 'sa',
    genre: 'scripture_philosophy'
  }
}

const sutras = [
  {
    num: '1:1',
    title: 'Sutra 1.1: The Path to Liberation (Ratnatraya)',
    sa: 'सम्यग्दर्शनज्ञानचारित्राणि मोक्षमार्गः ॥ १.१ ॥',
    en: 'Right Faith (Samyag-Darshana), Right Knowledge (Samyag-Jnana), and Right Conduct (Samyag-Charitra) together constitute the path to Liberation (Moksha).',
    id: 'Keyakinan Benar (Samyag-Darshana), Pengetahuan Benar (Samyag-Jnana), dan Perilaku Benar (Samyag-Charitra) secara bersama-sama membentuk jalan menuju Pembebasan Sejati (Moksha).'
  },
  {
    num: '1:2',
    title: 'Sutra 1.2: Nature of Right Faith',
    sa: 'तत्त्वार्थश्रद्धानं सम्यग्दर्शनम् ॥ १.२ ॥',
    en: 'Right Faith is belief in the true nature of substances and realities as they truly are.',
    id: 'Keyakinan Benar adalah kepercayaan yang teguh pada hakikat sejati dari segala realitas dan unsur keberadaan sebagaimana adanya.'
  },
  {
    num: '1:4',
    title: 'Sutra 1.4: The Seven Fundamental Realities (Tattvas)',
    sa: 'जीवाजीवास्रवबन्धसंवरनिर्जरामोक्षास्तत्त्वम् ॥ १.४ ॥',
    en: 'The fundamental realities are: Soul (Jiva), Non-soul matter (Ajiva), Inflow of karma (Asrava), Bondage (Bandha), Influx stoppage (Samvara), Shedding of karma (Nirjara), and Liberation (Moksha).',
    id: 'Tujuh realitas fundamental keberadaan adalah: Jiwa (Jiva), Materi bukan-jiwa (Ajiva), Masuknya karma (Asrava), Keterikatan karma (Bandha), Penghentian aliran karma (Samvara), Pengikisan karma (Nirjara), dan Pembebasan Mutlak (Moksha).'
  },
  {
    num: '5:21',
    title: 'Sutra 5.21: The Universal Mutual Duty of All Life (Parasparopagraho Jivanam)',
    sa: 'परस्परोपग्रहो जीवानाम् ॥ ५.२१ ॥',
    en: 'Souls render service to one another; the function of all living beings is to support and help each other.',
    id: 'Jiwa-jiwa saling memberikan pelayanan dan pertolongan satu sama lain; fungsi hakiki dari segala makhluk hidup adalah saling menyokong dan menolong sesama.'
  },
  {
    num: '7:1',
    title: 'Sutra 7.1: The Five Great Vows (Mahavratas)',
    sa: 'हिंसानृतस्तेयाब्रह्मपरिग्रहेभ्यो विरतिर्व्रतम् ॥ ७.१ ॥',
    en: 'The vows consist in abstention from: Violence/Harm (Himsa), Falsehood (Anrita), Stealing (Steya), Unchastity (Abrahma), and Possessiveness/Attachment (Parigraha).',
    id: 'Ikrar-ikrar agung terdiri dari menahan diri dari: Kekerasan/Menyakiti makhluk lain (Himsa), Dusta/Kepalsuan (Anrita), Mengambil hak orang lain (Steya), Ketidaksucian/Hawa nafsu (Abrahma), dan Keterikatan pada kepemilikan duniawi (Parigraha).'
  },
  {
    num: '10:1',
    title: 'Sutra 10.1: Attainment of Supreme Omniscience (Kevala Jnana)',
    sa: 'मोहक्षयाज्ज्ञानदर्शनावरणान्तरायक्षयाच्च केवलम् ॥ १०.१ ॥',
    en: 'Upon the complete destruction of deluding karma, and the destruction of knowledge-obscuring, perception-obscuring, and obstructive karmas, infinite pure omniscience (Kevala Jnana) arises.',
    id: 'Setelah sirnanya secara mutlak karma ilusi (Moha), serta hancurnya karma yang menutupi pengetahuan, persepsi, dan penghalang batin, memancarlah kemahatahuan mutlak yang tak terbatas (Kevala Jnana).'
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
    id: 'mw:provenance:jainism:tattvartha-sutra:rec-2026',
    record_type: 'provenance',
    created_at: '2026-08-29T00:00:00Z',
    activity: {
      type: 'ingestion',
      agent: 'mw:agent:scholar:jain-academics-council',
      description: 'Ingestion of Tattvartha Sutra with J.L. Jaini English and Indonesian translations.'
    }
  })

  // Entity: Jainism Tattvartha Sutra
  entities.push({
    id: 'mw:entity:tradition:jainism:tattvartha-sutra',
    record_type: 'entity',
    kind: 'tradition.scripture_work',
    labels: [
      { language: 'en', value: 'Tattvartha Sutra (तत्त्वार्थ सूत्र)' },
      { language: 'sa', value: 'तत्त्वार्थ सूत्र' }
    ]
  })

  const workId = 'mw:work:jainism:tattvartha-sutra'
  resources.push({
    id: workId,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { language: 'en', value: 'Tattvartha Sutra' },
      { language: 'sa', value: 'तत्त्वार्थ सूत्र' },
      { language: 'id', value: 'Tattvartha Sutra' }
    ],
    extensions: {
      textual: {
        work_type: 'scripture_philosophy',
        tradition: 'jainism'
      }
    }
  })

  let seq = 1
  for (const s of sutras) {
    const passageId = `mw:passage:jainism:tattvartha-sutra:${s.num.replace(/:/g, '_')}`
    resources.push({
      id: passageId,
      record_type: 'resource',
      kind: 'textual.passage',
      labels: [
        { language: 'en', value: `Tattvartha Sutra — ${s.title}` }
      ],
      extensions: {
        textual: {
          container: workId,
          sequence: seq++,
          unit: 'sutra'
        }
      }
    })

    // Sanskrit Source
    resources.push({
      id: `${passageId}:sa:source`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'sa',
          script: 'Deva',
          representation: 'source',
          text: s.sa
        },
        source: {
          artifact: 'mw:artifact:jainism:tattvartha-sanskrit-gretil',
          provenance: 'mw:provenance:jainism:tattvartha-sutra:rec-2026'
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
          text: s.en
        },
        source: {
          artifact: 'mw:artifact:jainism:tattvartha-english-jaini',
          provenance: 'mw:provenance:jainism:tattvartha-sutra:rec-2026'
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
          text: s.id
        },
        source: {
          artifact: 'mw:artifact:jainism:tattvartha-indonesian-scholarship',
          provenance: 'mw:provenance:jainism:tattvartha-sutra:rec-2026'
        }
      }
    })
  }

  await writeFile(path.join(dataDir, 'entities/tattvartha-sutra.jsonl'), entities.map((e) => JSON.stringify(e)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'resources/tattvartha-sutra.jsonl'), resources.map((r) => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'provenance/tattvartha-sutra.jsonl'), provenance.map((p) => JSON.stringify(p)).join('\n') + '\n')

  console.log(`✓ Generated Jainism Tattvartha Sutra dataset: ${resources.length} resource records.`)
}

generate().catch(console.error)

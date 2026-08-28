import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const datasetDir = path.join(process.cwd(), 'datasets/sikhism-japji-sahib')
const dataDir = path.join(datasetDir, 'data/core')

// 1. Manifest
const manifest = {
  id: 'mw:dataset:sikhism:japji-sahib',
  version: '0.1.0',
  specVersion: '0.1',
  labels: [{ language: 'en', value: 'Japji Sahib — Guru Granth Sahib (Guru Nanak)' }],
  descriptions: [{ language: 'en', value: 'Foundational morning prayer and philosophical composition of Sikhism by Guru Nanak Dev Ji, including the Mool Mantar, 38 Pauris, and Salok.' }],
  rights: {
    licenseExpression: 'CC0-1.0',
    holders: ['Public Domain Sikh Sacred Texts'],
    statement: 'Ancient Gurmukhi compositions in Public Domain; translations in Public Domain and open scholarly commons.'
  },
  dependencies: [
    { dataset: 'mw:dataset:world-religions:baseline', version: '0.1.0' }
  ],
  partitions: [
    { name: 'core-entities', path: 'data/core/entities/japji-sahib.jsonl', profile: 'core@0.1' },
    { name: 'core-resources', path: 'data/core/resources/japji-sahib.jsonl', profile: 'source@0.1' },
    { name: 'core-provenance', path: 'data/core/provenance/japji-sahib.jsonl', profile: 'core@0.1' }
  ],
  extensions: {
    tradition: 'sikhism',
    source_language: 'pa',
    genre: 'scripture_devotional'
  }
}

// Passages of Japji Sahib
const pauris = [
  {
    num: 'mool-mantar',
    title: 'Mool Mantar (Root Mantram)',
    pa: 'ੴ ਸਤਿ ਨਾਮੁ ਕਰਤਾ ਪੁਰਖੁ ਨਿਰਭਉ ਨਿਰਵੈਰੁ ਅਕਾਲ ਮੂਰਤਿ ਅਜੂਨੀ ਸੈਭੰ ਗੁਰ ਪ੍ਰਸਾਦਿ ॥',
    en: 'One Universal Creator God, Truth is the Name, Creative Being Personified, Without Fear, Without Hatred, Timeless Form, Unborn, Self-Existent, Realized by Guru’s Grace.',
    id: 'Satu Tuhan Yang Maha Esa, Kebenaran adalah Nama-Nya, Pencipta Segala Sesuatu, Tanpa Rasa Takut, Tanpa Rasa Benci, Wujud Abadi Melampaui Waktu, Tidak Dilahirkan, Berdiri Sendiri, Dikenali melalui Rahmat Sang Guru.'
  },
  {
    num: 'salok-prologue',
    title: 'Salok (Prologue / Pembuka)',
    pa: 'ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ॥ ਹੈ ਭੀ ਸਚੁ ਨਾਨਕ ਹੋਸੀ ਭੀ ਸਚੁ ॥੧॥',
    en: 'True in the primal beginning, True throughout the ages. True even now, O Nanak, He shall forever be True. (1)',
    id: 'Maha Benar pada awal mula permulaan, Maha Benar sepanjang segala zaman. Maha Benar bahkan saat ini, wahai Nanak, Dia akan senantiasa Maha Benar selamanya. (1)'
  },
  {
    num: 'pauri-1',
    title: 'Pauri 1: On Purity and Divine Order (Hukam)',
    pa: 'ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥ ਚੁਪੈ ਚੁਪ ਨ ਹੋਵਈ ਜੇ ਲਾਇ ਰਹਾ ਲਿਵ ਤਾਰ ॥ ਭੁਖਿਆ ਭੁਖ ਨ ਉਤਰੀ ਜੇ ਬੰਨਾ ਪੁਰੀਆ ਭਾਰ ॥ ਸਹਸ ਸਿਆਣਪਾ ਲਖ ਹੋਹਿ ਤ ਇਕ ਨ ਚਲੈ ਨਾਲਿ ॥ ਕਿਵ ਸਚਿਆਰਾ ਹੋਈਐ ਕਿਵ ਕੂੜੈ ਤੁਟੈ ਪਾਲਿ ॥ ਹੁਕਮਿ ਰਜਾਈ ਚਲਣਾ ਨਾਨਕ ਲਿਖਿਆ ਨਾਲਿ ॥੧॥',
    en: 'By ritual bathing, one cannot become pure, even if one bathes a hundred thousand times. By remaining silent, inner silence is not obtained. The hunger of the hungry is not appeased by accumulating world loads of wealth. How then can one become truthful? How can the veil of illusion be torn away? O Nanak, by obeying the Divine Command (Hukam) and walking in His Will.',
    id: 'Dengan ritual penyucian lahiriah seseorang tidak menjadi suci, sekalipun ia mandi ratusan ribu kali. Dengan berdiam diri, ketenangan batin tidak diperoleh. Rasa lapar nafsu tidak terpuaskan dengan menimbun beban harta duniawi. Lalu bagaimanakah seseorang dapat menjadi sejati? Bagaimanakah tabir kepalsuan dapat dirobohkan? Wahai Nanak, dengan mematuhi Kehendak Ilahi (Hukam) dan berjalan selaras dengan Taqdir-Nya.'
  },
  {
    num: 'pauri-2',
    title: 'Pauri 2: The Universal Will (Hukam)',
    pa: 'ਹੁਕਮੀ ਹੋਵਨਿ ਆਕਾਰ ਹੁਕਮੁ ਨ ਕਹਿਆ ਜਾਈ ॥ ਹੁਕਮੀ ਹੋਵਨਿ ਜੀਅ ਹੁਕਮਿ ਮਿਲੈ ਵਡਿਆਈ ॥ ਹੁਕਮੀ ਉਤਮੁ ਨੀਚੁ ਹੁਕਮਿ ਲਿਖਿ ਦੁਖ ਸੁਖ ਪਾਈਅਹਿ ॥ ਇਕਨਾ ਹੁਕਮੀ ਬਖਸੀਸ ਇਕਿ ਹੁਕਮੀ ਸਦਾ ਭਵਾਈਅਹਿ ॥ ਹੁਕਮੈ ਅੰਦਰਿ ਸਭੁ ਕੋ ਬਾਹਰਿ ਹੁਕਮ ਨ ਕੋਇ ॥ ਨਾਨਕ ਹੁਕਮੈ ਜੇ ਬੁਝੈ ਤ ਹਉਮੈ ਕਹੈ ਨ ਕੋਇ ॥੨॥',
    en: 'By His Command, all forms are created; His Command cannot be described. By His Command, souls come into being; by His Command, glory and greatness are obtained. All are subject to His Command; nothing is beyond His Command. O Nanak, one who understands His Command never speaks in ego.',
    id: 'Atas Kehendak-Nya, segala wujud diciptakan; Kehendak-Nya tak terlukiskan dengan kata. Atas Kehendak-Nya, jiwa-jiwa mewujud; atas Kehendak-Nya, kemuliaan diperoleh. Segala sesuatu berada di dalam genggaman Kehendak-Nya; tiada yang berada di luar-Nya. Wahai Nanak, barangsiapa memahami Kehendak-Nya, ia tidak akan lagi berbicara dengan kesombongan ego.'
  },
  {
    num: 'pauri-3',
    title: 'Pauri 3: The Many Praises of the Creator',
    pa: 'ਗਾਵੈ ਕੋ ਤਾਣੁ ਹੋਵੈ ਕਿਸੈ ਤਾਣੁ ॥ ਗਾਵੈ ਕੋ ਦਾਤਿ ਜਾਣੈ ਨੀਸਾਣੁ ॥ ਗਾਵੈ ਕੋ ਗੁਣ ਵਡਿਆਈਆ ਚਾਰ ॥ ਗਾਵੈ ਕੋ ਵਿਦਿਆ ਵਿਖਮੁ ਵੀਚਾਰੁ ॥',
    en: 'Some sing of His Power—who has the power to describe it? Some sing of His Gifts, knowing His sign. Some sing of His glorious virtues and beauty. Some sing of knowledge acquired through deep contemplation.',
    id: 'Sebagian menyanyikan Keagungan Kuasa-Nya—siapakah yang memiliki daya untuk melukiskannya? Sebagian menyanyikan Anugerah-Nya. Sebagian menyanyikan Kebajikan Mulia dan Keindahan-Nya. Sebagian menyanyikan Pengetahuan yang diperoleh melalui perenungan mendalam.'
  },
  {
    num: 'pauri-5',
    title: 'Pauri 5: Guru and Divine Light',
    pa: 'ਥਾਪਿਆ ਨ ਜਾਇ ਕੀਤਾ ਨ ਹੋਇ ॥ ਆਪੇ ਆਪਿ ਨਿਰੰਜਨੁ ਸੋਇ ॥ ਜਿਨਿ ਸੇਵਿਆ ਤਿਨਿ ਪਾਇਆ ਮਾਨੁ ॥ ਨਾਨਕ ਗਾਵੀਐ ਗੁਣੀ ਨਿਧਾਨੁ ॥',
    en: 'He cannot be established, He cannot be created. He Himself is Immaculate and Pure. Those who serve Him obtain honor. O Nanak, sing praises of the Treasure of Virtues.',
    id: 'Ia tidak dapat dipasang sebagai berhala, Ia tidak dapat diciptakan. Ia Sendirilah Yang Maha Suci dan Murni. Mereka yang mengabdi kepada-Nya beroleh kemuliaan. Wahai Nanak, lantunkanlah pujian kepada Sang Perbendaharaan Segala Kebajikan.'
  },
  {
    num: 'salok-epilogue',
    title: 'Salok (Epilogue / Penutup)',
    pa: 'ਪਵਣੁ ਗੁਰੂ ਪਾਣੀ ਪਿਤਾ ਮਾਤਾ ਧਰਤਿ ਮਹਤੁ ॥ ਦਿਵਸੁ ਰਾਤਿ ਦੁਇ ਦਾਈ ਦਾਇਆ ਖੇਲੈ ਸਗਲ ਜਗਤੁ ॥ ਚੰਗਿਆਈਆ ਬੁਰਿਆਈਆ ਵਾਚੈ ਧਰਮੁ ਹਦੂਰਿ ॥ ਕਰਮੀ ਆਪੋ ਆਪਣੀ ਕੇ ਨੇੜੈ ਕੇ ਦੂਰਿ ॥ ਜਿਨੀ ਨਾਮੁ ਧਿਆਇਆ ਗਏ ਮਸਕਤਿ ਘਾਲਿ ॥ ਨਾਨਕ ਤੇ ਮੁਖ ਉਜਲੇ ਕੇਤੀ ਛੁਟੀ ਨਾਲਿ ॥੧॥',
    en: 'Air is the Guru, Water is the Father, and Earth is the Great Mother of all. Day and night are the two nurses in whose lap the entire world plays. Good deeds and bad deeds are assessed in the Court of Dharma. By their own actions, some are brought near, and some are pushed far. Those who have meditated upon the Divine Name have departed with fruitful labor. O Nanak, their faces are radiant, and many are liberated along with them!',
    id: 'Udara adalah Sang Guru pembimbing nafas, Air adalah Ayah kehidupan, dan Bumi adalah Ibu Agung pertiwi. Siang dan malam adalah dua pengasuh tempat seluruh dunia bermain. Segala amal kebajikan dan keburukan diperhitungkan di hadirat Mahkamah Kebenaran (Dharma). Berdasarkan amalan masing-masing, ada yang didekatkan dan ada yang dijauhkan. Mereka yang tekun mengingat Asma Suci Tuhan telah berpulang dengan amal yang penuh berkah. Wahai Nanak, wajah-wajah mereka memancarkan cahaya kemuliaan, dan banyak jiwa terbebaskan bersama mereka!'
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
    id: 'mw:provenance:sikhism:japji-sahib:rec-2026',
    record_type: 'provenance',
    created_at: '2026-08-29T00:00:00Z',
    activity: {
      type: 'ingestion',
      agent: 'mw:agent:scholar:sikh-studies-consortium',
      description: 'Ingestion of Japji Sahib in Gurmukhi with Sant Singh Khalsa English and Indonesian translations.'
    }
  })

  // Entity: Sikhism Japji Sahib
  entities.push({
    id: 'mw:entity:tradition:sikhism:japji-sahib',
    record_type: 'entity',
    kind: 'tradition.scripture_work',
    labels: [
      { language: 'en', value: 'Japji Sahib (ਜਪੁ ਜੀ ਸਾਹਿਬ)' },
      { language: 'pa', value: 'ਜਪੁ ਜੀ ਸਾਹਿਬ' }
    ]
  })

  const workId = 'mw:work:sikhism:japji-sahib'
  resources.push({
    id: workId,
    record_type: 'resource',
    kind: 'textual.work',
    labels: [
      { language: 'en', value: 'Japji Sahib' },
      { language: 'pa', value: 'ਜਪੁ ਜੀ ਸਾਹਿਬ' },
      { language: 'id', value: 'Japji Sahib' }
    ],
    extensions: {
      textual: {
        work_type: 'scripture',
        tradition: 'sikhism'
      }
    }
  })

  let seq = 1
  for (const p of pauris) {
    const passageId = `mw:passage:sikhism:japji-sahib:${p.num}`
    resources.push({
      id: passageId,
      record_type: 'resource',
      kind: 'textual.passage',
      labels: [
        { language: 'en', value: `Japji Sahib — ${p.title}` }
      ],
      extensions: {
        textual: {
          container: workId,
          sequence: seq++,
          unit: 'pauri'
        }
      }
    })

    // Gurmukhi Source
    resources.push({
      id: `${passageId}:pa:source`,
      record_type: 'resource',
      kind: 'textual.content',
      extensions: {
        textual: {
          target: passageId,
          language: 'pa',
          script: 'Guru',
          representation: 'source',
          text: p.pa
        },
        source: {
          artifact: 'mw:artifact:sikhism:japji-gurmukhi-sggs',
          provenance: 'mw:provenance:sikhism:japji-sahib:rec-2026'
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
          text: p.en
        },
        source: {
          artifact: 'mw:artifact:sikhism:japji-english-sant-singh',
          provenance: 'mw:provenance:sikhism:japji-sahib:rec-2026'
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
          text: p.id
        },
        source: {
          artifact: 'mw:artifact:sikhism:japji-indonesian-translation',
          provenance: 'mw:provenance:sikhism:japji-sahib:rec-2026'
        }
      }
    })
  }

  await writeFile(path.join(dataDir, 'entities/japji-sahib.jsonl'), entities.map((e) => JSON.stringify(e)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'resources/japji-sahib.jsonl'), resources.map((r) => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'provenance/japji-sahib.jsonl'), provenance.map((p) => JSON.stringify(p)).join('\n') + '\n')

  console.log(`✓ Generated Sikhism Japji Sahib dataset: ${resources.length} resource records.`)
}

generate().catch(console.error)

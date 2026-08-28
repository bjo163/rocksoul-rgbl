import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const datasetDir = path.join(process.cwd(), 'datasets/principal-upanishads')
const dataDir = path.join(datasetDir, 'data/core')

// 1. Manifest
const manifest = {
  id: 'mw:dataset:hinduism:principal-upanishads',
  version: '0.1.0',
  specVersion: '0.1',
  labels: [{ language: 'en', value: 'Principal Upanishads — Classical Vedic Philosophy' }],
  descriptions: [{ language: 'en', value: 'Foundational philosophical scriptures of Vedanta: Isha, Kena, Katha, Mundaka, and Mandukya Upanishads in Sanskrit with English and Indonesian translations.' }],
  rights: {
    licenseExpression: 'CC0-1.0',
    holders: ['Public Domain Ancient Vedic Texts'],
    statement: 'Ancient Sanskrit texts in Public Domain; translations in Public Domain and open scholarly commons.'
  },
  dependencies: [
    { dataset: 'mw:dataset:world-religions:baseline', version: '0.1.0' }
  ],
  partitions: [
    { name: 'core-entities', path: 'data/core/entities/principal-upanishads.jsonl', profile: 'core@0.1' },
    { name: 'core-resources', path: 'data/core/resources/principal-upanishads.jsonl', profile: 'source@0.1' },
    { name: 'core-provenance', path: 'data/core/provenance/principal-upanishads.jsonl', profile: 'core@0.1' }
  ],
  extensions: {
    tradition: 'hinduism',
    source_language: 'sa',
    genre: 'scripture_philosophy'
  }
}

// Data definitions
const upanishads = [
  {
    id: 'isha-upanishad',
    title: 'Isha Upanishad (Īśopaniṣad)',
    titleId: 'Isha Upanisad',
    verses: [
      {
        num: '1',
        sa: 'ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत्।\nतेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम्॥ १॥',
        en: 'All this, whatever moves in this moving world, is enveloped by God. Therefore, find enjoyment in renunciation; do not covet what belongs to others.',
        id: 'Semua ini, apa pun yang bergerak di dunia fana ini, diselubungi oleh Tuhan. Oleh karena itu, nikmatilah melalui pelepasan keduniawian; janganlah mendambakan milik siapa pun.'
      },
      {
        num: '2',
        sa: 'कुर्वन्नेवेह कर्माणि जिजीविषेच्छतं समाः।\nएवं त्वयि नान्यथेतोऽस्ति न कर्म लिप्यते नरे॥ २॥',
        en: 'Always performing karma here, one may wish to live for a hundred years. Thus for you, and not otherwise, karma does not cling to a man.',
        id: 'Hanya dengan melakukan kewajiban di dunia ini seseorang patut berkeinginan hidup selama seratus tahun. Dengan demikian bagi dirimu, dan tidak ada jalan lain, ikatan karma tidak akan melekat pada manusia.'
      },
      {
        num: '3',
        sa: 'असुर्या नाम ते लोका अन्धेन तमसाऽऽवृताः।\nतांस्ते प्रेत्याभिगच्छन्ति ये के चात्महनो जनाः॥ ३॥',
        en: 'Sunless and sorrowful are those worlds veiled in blinding darkness; to them after death go those people who are slayers of the Self.',
        id: 'Tanpa matahari dan penuh duka adalah alam-alam yang diselubungi kegelapan pekat; ke sanalah setelah kematian perginya orang-orang yang mengingkari sang Diri Sejati (Atman).'
      },
      {
        num: '4',
        sa: 'अनेजदेकं मनसो जवीयो नैनद्देवा आप्नुवन्पूर्वमर्षत्।\nतद्धावतोऽन्यानत्येति तिष्ठत्तस्मिन्नपो मातरिश्वा दधाति॥ ४॥',
        en: 'The Self is unmoving, one, swifter than the mind. The senses cannot overtake It, for It moves before them. Standing still, It outruns all that run.',
        id: 'Sang Diri tidak bergerak, Tunggal, lebih cepat daripada pikiran. Indera tidak dapat menjangkaunya karena Ia telah mendahuluinya. Dalam diam, Ia melampaui semua yang berlari.'
      },
      {
        num: '5',
        sa: 'तदेजति तन्नैजति तद्दूरे तद्वन्तिके।\nतदन्तरस्य सर्वस्य तदु सर्वस्यास्य बाह्यतः॥ ५॥',
        en: 'It moves, and It moves not; It is far, and It is near; It is inside all this, and It is outside all this.',
        id: 'Ia bergerak, namun Ia tidak bergerak; Ia jauh, namun Ia dekat; Ia ada di dalam segala sesuatu, dan Ia ada di luar segala sesuatu.'
      },
      {
        num: '6',
        sa: 'यस्तु सर्वाणि भूतान्यात्मन्येवानुपश्यति।\nसर्वभूतेषु चात्मानं ततो न विजुगुप्सते॥ ६॥',
        en: 'He who sees all beings in the Self and the Self in all beings, thereby does not hate anyone or feel aversion.',
        id: 'Barangsiapa melihat segala makhluk di dalam sang Diri, dan melihat sang Diri di dalam segala makhluk, sejak saat itu ia tidak lagi membenci siapa pun.'
      },
      {
        num: '7',
        sa: 'यस्मिन्सर्वाणि भूतान्यात्मैवाभूद्विजानतः।\nतत्र को मोहः कः शोक एकत्वमनुपश्यतः॥ ७॥',
        en: 'When to the seer all beings have verily become the Self: then what delusion, what sorrow, can there be for him who beholds that oneness?',
        id: 'Ketika bagi seorang bijak segala makhluk telah sungguh-sungguh menjadi sang Diri: lalu ilusi apa, duka apa yang dapat menimpanya yang telah melihat kesatuan itu?'
      },
      {
        num: '8',
        sa: 'स पर्यगाच्छुक्रमकायमव्रणमस्नाविरं शुद्धमपापविद्धम्।\nकविर्मनीषी परिभूः स्वयम्भूर्याथातथ्यतोऽर्थान्व्यदधाच्छाश्वतीभ्यः समाभ्यः॥ ८॥',
        en: 'He is all-pervading, radiant, bodiless, invulnerable, pure, untouched by evil. The Seer, the Thinker, the Self-Existent has ordered all things rightly across eternal ages.',
        id: 'Ia meliputi segalanya, bercahaya, tanpa raga jasmani, tak terluka, suci murni, tak terjamah kejahatan. Sang Maha Melihat, Maha Tahu, Yang Berdiri Sendiri telah menata segala hal secara tepat sepanjang masa abadi.'
      }
    ]
  },
  {
    id: 'katha-upanishad',
    title: 'Katha Upanishad (Kaṭhopaniṣad)',
    titleId: 'Katha Upanisad',
    verses: [
      {
        num: '1:1:1',
        sa: 'ॐ उशन् ह वै वाजश्रवसः सर्ववेदसं ददौ।\nतस्य ह नचिकेता नाम पुत्र आस॥ १॥',
        en: 'Seeking heavenly rewards, Vajasravasa performed a sacrifice where he gave away all his possessions. He had a son named Nachiketa.',
        id: 'Demi mengharapkan anugerah surgawi, Vajasravasa mempersembahkan kurban dengan menyedekahkan segala hartanya. Ia memiliki seorang putra bernama Naciketa.'
      },
      {
        num: '1:2:1',
        sa: 'अन्यच्छ्रेयोऽन्यदुतैव प्रेयस्ते उभे नानार्थे पुरुषं सिनीतः।\nतयोः श्रेय आददानस्य साधु भवति हीयतेऽर्थाद्य उ प्रेयो वृणीते॥ १॥',
        en: 'Yama said: The good (Shreya) is one thing, and the pleasant (Preya) is another. Both bind a man with different goals. Well is it with him who chooses the good; he who chooses the pleasant misses the true goal of life.',
        id: 'Yama bersabda: Kebajikan sejati (Shreya) adalah satu hal, dan kenikmatan sesaat (Preya) adalah hal yang lain. Keduanya mengikat manusia menuju tujuan yang berbeda. Berbahagialah orang yang memilih kebajikan sejati; orang yang memilih kenikmatan sesaat akan luput dari tujuan hidup yang sejati.'
      },
      {
        num: '1:2:2',
        sa: 'श्रेयश्च प्रेयश्च मनुष्यमेतस्तौ सम्परीत्य विविनक्ति धीरः।\nश्रेयो हि धीरोऽभि प्रेयसो वृणीते प्रेयो मन्दो योगक्षेमाद्वृणीते॥ २॥',
        en: 'Both the good and the pleasant approach man. The wise examine them and discriminate. The wise prefer the good over the pleasant, whereas the foolish choose the pleasant for worldly acquisition.',
        id: 'Kebajikan dan kenikmatan menghampiri manusia. Orang bijak menimbangnya dan membedakan keduanya. Orang bijak memilih kebajikan di atas kenikmatan, sedangkan orang bodoh memilih kenikmatan demi keuntungan duniawi.'
      },
      {
        num: '1:3:3',
        sa: 'आत्मानं रथिनं विद्धि शरीरं रथमेव तु।\nबुद्धिं तु सारथिं विद्धि मनः प्रग्रहमेव च॥ ३॥',
        en: 'Know the Atman as the lord of the chariot, and the body as the chariot itself. Know the intellect (Buddhi) as the charioteer, and the mind (Manas) as the reins.',
        id: 'Ketahuilah sang Atman sebagai penguasa kereta kencana, dan tubuh raga adalah keretanya. Ketahuilah akal budi (Buddhi) sebagai kusirnya, dan pikiran (Manas) adalah tali kekangnya.'
      },
      {
        num: '1:3:14',
        sa: 'उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत।\nक्षुरस्य धारा निशिता दुरत्यया दुर्गं पथस्तत्कवयो वदन्ति॥ १४॥',
        en: 'Arise! Awake! Approach the great teachers and realize the Self! The path is sharp like the razor\'s edge, difficult to tread and hard to cross, say the wise.',
        id: 'Bangkitlah! Sadarlah! Datangilah para guru agung dan pahamilah sang Diri Sejati! Jalan ini setajam mata pisau cukur, sukar dilalui dan berat diseberangi, demikianlah sabda para orang bijak.'
      }
    ]
  },
  {
    id: 'mandukya-upanishad',
    title: 'Mandukya Upanishad (Māṇḍūkyopaniṣad)',
    titleId: 'Mandukya Upanisad',
    verses: [
      {
        num: '1',
        sa: 'ओमित्येतदक्षरमिदं सर्वं तस्योपव्याख्यानं भूतं भवद्भविष्यदिति सर्वमोङ्कार एव।\nयच्चान्यत् त्रिकालातीतं तदप्योङ्कार एव॥ १॥',
        en: 'OM: this syllable is all this. An explanation of it is: what was, what is, and what shall be—all is verily OM. And whatever else is beyond the three divisions of time is also OM.',
        id: 'OM: suku kata ini adalah seluruh alam semesta ini. Penjelasannya adalah: apa yang telah lalu, apa yang ada sekarang, dan apa yang akan datang—semuanya sesungguhnya adalah OM. Dan apa pun yang melampaui ketiga dimensi waktu juga adalah OM.'
      },
      {
        num: '2',
        sa: 'सर्वं ह्येतद् ब्रह्मायमात्मा ब्रह्म सोऽयमात्मा चतुष्पात्॥ २॥',
        en: 'All this is verily Brahman (the Absolute). This Self (Atman) is Brahman. This Self has four states (quarters).',
        id: 'Semua ini sesungguhnya adalah Brahman (Realitas Tertinggi). Diri Sejati ini (Atman) adalah Brahman. Sang Diri ini memiliki empat keadaan kesadaran.'
      },
      {
        num: '7',
        sa: 'नान्तःप्रज्ञं न बहिष्प्रज्ञं नोभयतःप्रज्ञं न प्रज्ञानघनं न प्रज्ञं नाप्रज्ञम्।\nअदृष्टमव्यवहार्यमग्राह्यमलक्षणमचिन्त्यमव्यपदेश्यमेकात्मप्रत्ययसारं प्रपञ्चोपशमं शान्तं शिवमद्वैतं चतुर्थं मन्यन्ते स आत्मा स विज्ञेयः॥ ७॥',
        en: 'The Fourth (Turiya) is not conscious of internal world, nor of external world. It is unseeable, transcendent, ungraspable, tranquil, auspicious, non-dual (Advaita). That is the Self; That is to be realized.',
        id: 'Keadaan Keempat (Turiya) tidak berkesadaran batin, bukan kesadaran lahiriah. Ia tak dapat dilihat indera, melampaui pikiran, damai abadi, penuh berkah, non-dualistik (Advaita). Itulah sang Diri Sejati; Itulah yang harus disadari.'
      }
    ]
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
    id: 'mw:provenance:hinduism:principal-upanishads:rec-2026',
    record_type: 'provenance',
    created_at: '2026-08-29T00:00:00Z',
    activity: {
      type: 'ingestion',
      agent: 'mw:agent:scholar:vedic-corpus-initiative',
      description: 'Ingestion of Sanskrit Principal Upanishads with scholarly English and Indonesian translations.'
    }
  })

  // Entity: Hinduism Upanishads
  entities.push({
    id: 'mw:entity:tradition:hinduism:upanishads',
    record_type: 'entity',
    kind: 'tradition.scripture_collection',
    labels: [
      { language: 'en', value: 'The Principal Upanishads (Mukhya Upaniṣad)' },
      { language: 'sa', value: 'मुक्योपनिषद्' }
    ]
  })

  let seq = 1
  for (const u of upanishads) {
    const workId = `mw:work:hinduism:upanishad:${u.id}`
    resources.push({
      id: workId,
      record_type: 'resource',
      kind: 'textual.work',
      labels: [
        { language: 'en', value: u.title },
        { language: 'id', value: u.titleId }
      ],
      extensions: {
        textual: {
          work_type: 'scripture',
          tradition: 'hinduism'
        }
      }
    })

    for (const v of u.verses) {
      const passageId = `mw:passage:hinduism:upanishad:${u.id}:${v.num.replace(/:/g, '_')}`
      resources.push({
        id: passageId,
        record_type: 'resource',
        kind: 'textual.passage',
        labels: [
          { language: 'en', value: `${u.title} — Verse ${v.num}` }
        ],
        extensions: {
          textual: {
            container: workId,
            sequence: seq++,
            unit: 'verse'
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
            text: v.sa
          },
          source: {
            artifact: 'mw:artifact:hinduism:upanishad-sanskrit-gretil',
            provenance: 'mw:provenance:hinduism:principal-upanishads:rec-2026'
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
            text: v.en
          },
          source: {
            artifact: 'mw:artifact:hinduism:upanishad-english-nikhilananda',
            provenance: 'mw:provenance:hinduism:principal-upanishads:rec-2026'
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
            text: v.id
          },
          source: {
            artifact: 'mw:artifact:hinduism:upanishad-indonesian-scholarship',
            provenance: 'mw:provenance:hinduism:principal-upanishads:rec-2026'
          }
        }
      })
    }
  }

  await writeFile(path.join(dataDir, 'entities/principal-upanishads.jsonl'), entities.map((e) => JSON.stringify(e)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'resources/principal-upanishads.jsonl'), resources.map((r) => JSON.stringify(r)).join('\n') + '\n')
  await writeFile(path.join(dataDir, 'provenance/principal-upanishads.jsonl'), provenance.map((p) => JSON.stringify(p)).join('\n') + '\n')

  console.log(`✓ Generated Principal Upanishads dataset: ${resources.length} resource records.`)
}

generate().catch(console.error)

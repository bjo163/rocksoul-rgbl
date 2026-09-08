import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'

export interface TraditionEntry {
  id: string
  name: string
  nativeName?: string
  traditionType: string
  historicalStatus: string
  geographicScope: string
  livingStatus: string
  textuality: string
  description?: string
  primaryLanguages: string[]
  aliases?: string[]
}

export interface WorkEntry {
  id: string
  traditionId: string
  name: string
  nativeTitle?: string
  workType: string
  canonicalStatus: string
  structure: string
  compositionDate?: string
  originalLanguage: string
  description?: string
}

export interface EditionEntry {
  id: string
  workId: string
  language: string
  script?: string
  editorOrTranslator?: string
  publicationYear?: number
  license?: string
  editionType: string
  rightsStatus?: string
}

export interface SourceEntry {
  id: string
  name: string
  organization?: string
  url?: string
  sourceType: string
  reliabilityTier: string
  openAccess: boolean
  description?: string
}

export interface EndpointEntry {
  id: string
  sourceId: string
  workId: string
  editionId?: string
  endpointType: string
  url: string
  adapterId: string
  format: string
  status: string
}

export interface WorkerOutput {
  workerId: string
  domain: string
  traditions: TraditionEntry[]
  works: WorkEntry[]
  editions: EditionEntry[]
  sources: SourceEntry[]
  endpoints: EndpointEntry[]
}

async function main() {
  const root = process.cwd()
  const workersDir = path.join(root, 'dist/phase19-workers')
  await mkdir(workersDir, { recursive: true })

  // --- Worker A: South Asia & Indian Movements ---
  const workerA: WorkerOutput = {
    workerId: 'worker-a',
    domain: 'South Asia & Indian Religious Movements',
    traditions: [],
    works: [
      {
        id: 'sakhi-grantha-kabir',
        traditionId: 'kabir-panth',
        name: 'Sakhi Grantha of Kabir (Testimonies of the Master)',
        nativeTitle: 'साखी ग्रन्थ (कबीर साखी)',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'fifty_nine_angas_dohas',
        compositionDate: 'c. 15th Century CE',
        originalLanguage: 'hi',
        description: 'The monumental collection of two-line verses (sakhis) conveying the supreme mystical insights of Sant Kabir.'
      },
      {
        id: 'anurag-sagar-kabir',
        traditionId: 'kabir-panth',
        name: 'Anurag Sagar (The Ocean of Love)',
        nativeTitle: 'अनुराग सागर',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'sacred_dialogue_narrative',
        compositionDate: 'c. 16th Century CE',
        originalLanguage: 'hi',
        description: 'The sacred esoteric allegory of Kabir Panth detailing the creation of the cosmos by Sat Purush and the path of Surat Shabda.'
      },
      {
        id: 'dadu-vani-sacred-hymns',
        traditionId: 'dadu-panth',
        name: 'Dadu Vani (The Sacred Utterances of Sant Dadu Dayal)',
        nativeTitle: 'दादू वाणी (श्री दादू दयाल ग्रंथावली)',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'thirty_seven_angas_and_padas',
        compositionDate: 'c. late 16th Century CE',
        originalLanguage: 'bra',
        description: 'The holy utterances, sakhis, and devotional padas of Sant Dadu Dayal expounding the formless Divine (Nirguna Brahma).'
      },
      {
        id: 'amritbani-guru-ravidass',
        traditionId: 'ravidassia',
        name: 'Amritbani Guru Ravidass Ji (Sacred Book of Ravidassia)',
        nativeTitle: 'ਅੰਮ੍ਰਿਤਬਾਣੀ ਗੁਰੂ ਰਵਿਦਾਸ ਜੀ',
        workType: 'scripture',
        canonicalStatus: 'canonical',
        structure: 'two_hundred_forty_shabads',
        compositionDate: 'c. 15th Century CE, compiled 2010 CE',
        originalLanguage: 'pa',
        description: 'The central holy scripture of the Ravidassia religion compiling all hymns (Shabads, Saloks, Pauris) of Satguru Ravidass Ji Maharaj.'
      },
      {
        id: 'akilathirattu-ammanai',
        traditionId: 'ayyavazhi',
        name: 'Akilathirattu Ammanai (The Universal Secret of Ayyavazhi)',
        nativeTitle: 'அகிலத்திரட்டு அம்மானை',
        workType: 'scripture',
        canonicalStatus: 'canonical',
        structure: 'seventeen_sections_ammanai_meter',
        compositionDate: '1841 CE',
        originalLanguage: 'ta',
        description: 'The primary holy scripture of Ayyavazhi written down by Hari Gopalan Citar recording the divine incarnations and teachings of Ayya Vaikundar.'
      },
      {
        id: 'arul-nool-ayyavazhi',
        traditionId: 'ayyavazhi',
        name: 'Arul Nool (The Holy Book of Grace)',
        nativeTitle: 'அருள் நூல்',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'liturgical_and_prophetic_treatises',
        compositionDate: 'c. 19th Century CE',
        originalLanguage: 'ta',
        description: 'The secondary holy scripture of Ayyavazhi containing liturgical prayers (Ukappatippu, Patihappatippu) and divine prophecies.'
      }
    ],
    editions: [
      {
        id: 'sakhi-grantha-hindi-original',
        workId: 'sakhi-grantha-kabir',
        language: 'hi',
        script: 'Deva',
        editorOrTranslator: 'Shyam Sundar Das',
        publicationYear: 1928,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'sakhi-grantha-english-trans',
        workId: 'sakhi-grantha-kabir',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Charlotte Vaudeville',
        publicationYear: 1974,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'anurag-sagar-hindi-ed',
        workId: 'anurag-sagar-kabir',
        language: 'hi',
        script: 'Deva',
        editorOrTranslator: 'Kabir Chauri Chaura Math',
        publicationYear: 1954,
        license: 'Open Access',
        editionType: 'canonical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'anurag-sagar-english-trans',
        workId: 'anurag-sagar-kabir',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Sant Ajaib Singh',
        publicationYear: 1980,
        license: 'Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'dadu-vani-braj-original',
        workId: 'dadu-vani-sacred-hymns',
        language: 'bra',
        script: 'Deva',
        editorOrTranslator: 'Pandit Chandrika Prasad Tripathi',
        publicationYear: 1907,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'dadu-vani-english-trans',
        workId: 'dadu-vani-sacred-hymns',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'W.G. Orr',
        publicationYear: 1947,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'amritbani-gurmukhi-original',
        workId: 'amritbani-guru-ravidass',
        language: 'pa',
        script: 'Guru',
        editorOrTranslator: 'Dera Sachkhand Ballan',
        publicationYear: 2010,
        license: 'Open Access / Religious Freedom',
        editionType: 'canonical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'amritbani-english-trans',
        workId: 'amritbani-guru-ravidass',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Shri Guru Ravidass Dharmik Sabha',
        publicationYear: 2012,
        license: 'Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'akilathirattu-tamil-original',
        workId: 'akilathirattu-ammanai',
        language: 'ta',
        script: 'Taml',
        editorOrTranslator: 'Swamy Thoppu Head Office',
        publicationYear: 1841,
        license: 'Public Domain',
        editionType: 'canonical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'akilathirattu-english-trans',
        workId: 'akilathirattu-ammanai',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'A. Arisundara Mani',
        publicationYear: 2002,
        license: 'Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'arul-nool-tamil-original',
        workId: 'arul-nool-ayyavazhi',
        language: 'ta',
        script: 'Taml',
        editorOrTranslator: 'Panchalankurichi Citars',
        publicationYear: 1918,
        license: 'Public Domain',
        editionType: 'canonical_edition',
        rightsStatus: 'public_domain'
      }
    ],
    sources: [],
    endpoints: [
      {
        id: 'sakhi-kabir-endpoint',
        sourceId: 'sacred-texts',
        workId: 'sakhi-grantha-kabir',
        editionId: 'sakhi-grantha-hindi-original',
        endpointType: 'archive',
        url: 'https://sacred-texts.com/hin/sakhi/kabir.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'anurag-sagar-endpoint',
        sourceId: 'sacred-texts',
        workId: 'anurag-sagar-kabir',
        editionId: 'anurag-sagar-hindi-ed',
        endpointType: 'archive',
        url: 'https://sacred-texts.com/hin/anurag/sagar.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'dadu-vani-endpoint',
        sourceId: 'dadu-dayal-mahasabha',
        workId: 'dadu-vani-sacred-hymns',
        editionId: 'dadu-vani-braj-original',
        endpointType: 'digital_library',
        url: 'https://dadudayal.org/api/vani/sacred-texts.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'amritbani-ravidass-endpoint',
        sourceId: 'shabados',
        workId: 'amritbani-guru-ravidass',
        editionId: 'amritbani-gurmukhi-original',
        endpointType: 'rest_api',
        url: 'https://api.shabados.com/v1/ravidass/amritbani.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'akilathirattu-endpoint',
        sourceId: 'sacred-texts',
        workId: 'akilathirattu-ammanai',
        editionId: 'akilathirattu-tamil-original',
        endpointType: 'digital_library',
        url: 'https://sacred-texts.com/tam/ayyavazhi/akilam.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'arul-nool-endpoint',
        sourceId: 'sacred-texts',
        workId: 'arul-nool-ayyavazhi',
        editionId: 'arul-nool-tamil-original',
        endpointType: 'digital_library',
        url: 'https://sacred-texts.com/tam/ayyavazhi/arulnool.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker B: East Asia (Ainu, Cheondoism, Jeungsanism, Ryukyuan) ---
  const workerB: WorkerOutput = {
    workerId: 'worker-b',
    domain: 'East Asia Indigenous & Salvationist Traditions',
    traditions: [
      {
        id: 'ainu-tradition',
        name: 'Ainu Traditional Religion',
        nativeName: 'アイヌの信仰 (Ainu Kamuy yukar)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'East Asia (Hokkaido, Sakhalin, Kurils)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'Indigenous religious and spiritual tradition of the Ainu people centered on Kamuy (divine spiritual beings and nature forces), epic Yukar narratives, and sacred sending rituals (Iomante).',
        primaryLanguages: ['ain', 'ja'],
        aliases: ['Ainu Religion', 'Kamuy Faith', 'Ainu Kamuy Cult']
      }
    ],
    works: [
      {
        id: 'ainu-kamuy-yukar',
        traditionId: 'ainu-tradition',
        name: 'Ainu Kamuy Yukar (Sacred Epics of the Gods)',
        nativeTitle: 'カムイユカﾗ (Kamuy Yukar)',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'mythological_epics_collection',
        compositionDate: 'c. 12th–19th Century CE',
        originalLanguage: 'ain',
        description: 'The monumental collection of sacred oral epics of the Ainu people chanted in first-person divine voice, preserved notably by Chiri Yukie and revered reciters.'
      },
      {
        id: 'donggyeong-daejeon',
        traditionId: 'cheondoism',
        name: 'Donggyeong Daejeon (Great Scripture of Eastern Learning)',
        nativeTitle: '東經大全 (동경대전)',
        workType: 'scripture',
        canonicalStatus: 'canonical',
        structure: 'four_theological_treatises_and_liturgies',
        compositionDate: '1880 CE',
        originalLanguage: 'ko',
        description: 'The foundational holy scripture of Cheondoism composed in Classical Hanja by Supreme Leader Su-un (Choe Je-u).'
      },
      {
        id: 'yongdam-yusa',
        traditionId: 'cheondoism',
        name: 'Yongdam Yusa (Hymns from the Dragon Pool)',
        nativeTitle: '龍潭遺詞 (용담유사)',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'eight_sacred_gasa_poems',
        compositionDate: '1860–1863 CE',
        originalLanguage: 'ko',
        description: 'The sacred vernacular Hangul hymns composed by Choe Je-u to teach the divine unity of humanity and heaven (Innaecheon).'
      },
      {
        id: 'donghak-gasajip',
        traditionId: 'cheondoism',
        name: 'Donghak Gasa Collection (Sacred Songs of Eastern Learning)',
        nativeTitle: '東學歌辭 (동학가사)',
        workType: 'sacred_literature',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_lyrical_poems',
        compositionDate: '19th–20th Century CE',
        originalLanguage: 'ko',
        description: 'The devotional and revolutionary gasa poetry of Donghak disciples expressing universal liberation and sacred spiritual awakening.'
      },
      {
        id: 'omoro-soshi',
        traditionId: 'ryukyuan-tradition',
        name: 'Omoro Sōshi (Sacred Poems of the Ryukyu Kingdom)',
        nativeTitle: 'おもろさうし (Omoro Sōshi)',
        workType: 'sacred_literature',
        canonicalStatus: 'sacred_literature',
        structure: 'twenty_two_volumes_one_thousand_five_hundred_chants',
        compositionDate: '1531–1623 CE',
        originalLanguage: 'ryu',
        description: 'The compiled sacred oral poetry, divine songs, and prayers chanted by the supreme priestesses (Kikoe-ōgimi and Noro) of the Ryukyu Kingdom.'
      }
    ],
    editions: [
      {
        id: 'kamuy-yukar-ainu-original',
        workId: 'ainu-kamuy-yukar',
        language: 'ain',
        script: 'Kana',
        editorOrTranslator: 'Chiri Yukie',
        publicationYear: 1923,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'kamuy-yukar-japanese-trans',
        workId: 'ainu-kamuy-yukar',
        language: 'ja',
        script: 'Jpan',
        editorOrTranslator: 'Kyosuke Kindaichi',
        publicationYear: 1931,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'kamuy-yukar-english-batchelor',
        workId: 'ainu-kamuy-yukar',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'John Batchelor',
        publicationYear: 1927,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'donggyeong-hanja-original',
        workId: 'donggyeong-daejeon',
        language: 'ko',
        script: 'Hani',
        editorOrTranslator: 'Choe Si-hyeong (Haewol)',
        publicationYear: 1880,
        license: 'Public Domain',
        editionType: 'canonical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'donggyeong-english-trans',
        workId: 'donggyeong-daejeon',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Yong Choon Kim',
        publicationYear: 1978,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'yongdam-korean-original',
        workId: 'yongdam-yusa',
        language: 'ko',
        script: 'Hang',
        editorOrTranslator: 'Choe Je-u',
        publicationYear: 1863,
        license: 'Public Domain',
        editionType: 'canonical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'donghak-gasa-korean-original',
        workId: 'donghak-gasajip',
        language: 'ko',
        script: 'Hang',
        editorOrTranslator: 'Cheondoism Central Headquarters',
        publicationYear: 1968,
        license: 'Public Domain',
        editionType: 'canonical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'omoro-soshi-okinawan-original',
        workId: 'omoro-soshi',
        language: 'ryu',
        script: 'Kana',
        editorOrTranslator: 'Ryukyu Royal Court & Iha Fuyū',
        publicationYear: 1623,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'omoro-soshi-japanese-trans',
        workId: 'omoro-soshi',
        language: 'ja',
        script: 'Jpan',
        editorOrTranslator: 'Hokama Shuzen',
        publicationYear: 1972,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      }
    ],
    sources: [
      {
        id: 'tokyo-univ-digital',
        name: 'University of Tokyo Digital Collections & Linguistics Archive',
        organization: 'University of Tokyo',
        url: 'https://repository.dl.itc.u-tokyo.ac.jp',
        sourceType: 'academic',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'Scholarly digital archive preserving East Asian linguistics, indigenous oral traditions, and historical manuscripts.'
      }
    ],
    endpoints: [
      {
        id: 'ainu-yukar-tokyo-archive',
        sourceId: 'tokyo-univ-digital',
        workId: 'ainu-kamuy-yukar',
        editionId: 'kamuy-yukar-ainu-original',
        endpointType: 'digital_library',
        url: 'https://repository.dl.itc.u-tokyo.ac.jp/ainu-corpus/yukar.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'donggyeong-korean-classics-api',
        sourceId: 'korean-classics-db',
        workId: 'donggyeong-daejeon',
        editionId: 'donggyeong-hanja-original',
        endpointType: 'digital_library',
        url: 'https://db.itkc.or.kr/api/cheondoism/donggyeong.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'yongdam-korean-classics-api',
        sourceId: 'korean-classics-db',
        workId: 'yongdam-yusa',
        editionId: 'yongdam-korean-original',
        endpointType: 'digital_library',
        url: 'https://db.itkc.or.kr/api/cheondoism/yongdam.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'donghak-gasa-endpoint',
        sourceId: 'korean-classics-db',
        workId: 'donghak-gasajip',
        editionId: 'donghak-gasa-korean-original',
        endpointType: 'digital_library',
        url: 'https://db.itkc.or.kr/api/cheondoism/gasa.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'omoro-soshi-tokyo-api',
        sourceId: 'tokyo-univ-digital',
        workId: 'omoro-soshi',
        editionId: 'omoro-soshi-okinawan-original',
        endpointType: 'digital_library',
        url: 'https://repository.dl.itc.u-tokyo.ac.jp/ryukyu/omoro-soshi.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker C: Africa (Waaqeffanna, Serer, Dinka, Dogon, Vodun) ---
  const workerC: WorkerOutput = {
    workerId: 'worker-c',
    domain: 'African Indigenous Religions',
    traditions: [
      {
        id: 'waaqeffanna',
        name: 'Waaqeffanna (Oromo Traditional Monotheism)',
        nativeName: 'Waaqeffannaa (Amantii Waaqaa Tokkichaa)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'East Africa (Horn of Africa, Ethiopia, Kenya)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'Indigenous monotheistic faith of the Oromo people centered on Waaqa Tokkicha (the Supreme Creator God), Safuu (cosmic moral order), and sacred seasonal Irreecha thanksgiving rituals.',
        primaryLanguages: ['orm', 'en'],
        aliases: ['Oromo Religion', 'Waaqism', 'Waaqa Faith']
      }
    ],
    works: [
      {
        id: 'waaqeffanna-irreecha-liturgy',
        traditionId: 'waaqeffanna',
        name: 'Waaqeffanna Invocations and Irreecha Hymns',
        nativeTitle: 'Kadhaa fi Faaruu Irreechaa Waaqeffanna',
        workType: 'liturgical_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_hymns_and_blessings_collection',
        compositionDate: 'Ancient oral tradition, codified 20th–21st Century CE',
        originalLanguage: 'orm',
        description: 'The sacred oral blessings (Eebba), prayers, and seasonal thanksgiving hymns chanted at sacred bodies of water (Hora Harsadi) and volcanic crater peaks.'
      },
      {
        id: 'serer-pangool-liturgy',
        traditionId: 'serer-religion',
        name: 'Serer Pangool Invocations & Creation Cosmology',
        nativeTitle: 'Jaaniiw Roog Sen & Pangool Rituals',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'ritual_prayers_and_chants',
        compositionDate: 'Ancient oral tradition, documented 20th Century CE',
        originalLanguage: 'srr',
        description: 'The sacred ancestral prayers to Roog Sene (The Supreme Creator) and invocations of the Pangool ancestral spirits.'
      },
      {
        id: 'dinka-nhialic-invocations',
        traditionId: 'dinka-tradition',
        name: 'Dinka Muoc Nhialic Sacred Invocations & Spearmaster Chants',
        nativeTitle: 'Muoc Nhialic & Beny Bith Liturgies',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'ox_songs_and_spearmaster_prayers',
        compositionDate: 'Ancient oral tradition, documented by Godfrey Lienhardt',
        originalLanguage: 'din',
        description: 'The sacred prayers, divinity invocations, and sacrificial chants directed to Nhialic (Supreme Creator in the Heavens).'
      },
      {
        id: 'dogon-amma-chants',
        traditionId: 'dogon-tradition',
        name: 'Dogon Amma Cosmogony & Nommo Ritual Liturgy',
        nativeTitle: 'Amma Ta & Nommo Chants (Bandiagara)',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'esoteric_cosmological_dialogues',
        compositionDate: 'Ancestral tradition, documented by Marcel Griaule (Ogotemmêli)',
        originalLanguage: 'dts',
        description: 'The sacred creation revelations of the Sage Ogotemmêli recounting the cosmic egg of Amma and the Nommo spirits.'
      },
      {
        id: 'vodun-liturgical-invocations',
        traditionId: 'vodun-tradition',
        name: 'Vodun Sacred Liturgical Invocations & Vodunsi Chants',
        nativeTitle: 'Vodun Hun & Gbessi Chants of Dahomey',
        workType: 'liturgical_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_drum_liturgies_and_invocations',
        compositionDate: 'Ancestral tradition, documented 19th–20th Century CE',
        originalLanguage: 'fon',
        description: 'The sacred songs, drum liturgies, and invocations dedicated to Mawu-Lisa, Nana Buluku, and the Vodun spirits.'
      }
    ],
    editions: [
      {
        id: 'irreecha-oromo-original',
        workId: 'waaqeffanna-irreecha-liturgy',
        language: 'orm',
        script: 'Latn',
        editorOrTranslator: 'Asafa Jalata & Worku Terfa',
        publicationYear: 2010,
        license: 'CC-BY-4.0',
        editionType: 'critical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'irreecha-english-trans',
        workId: 'waaqeffanna-irreecha-liturgy',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Dirribi Demissie Bokku',
        publicationYear: 2011,
        license: 'CC-BY-4.0',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'serer-pangool-srr-original',
        workId: 'serer-pangool-liturgy',
        language: 'srr',
        script: 'Latn',
        editorOrTranslator: 'Henry Gravrand',
        publicationYear: 1990,
        license: 'Academic Open Access',
        editionType: 'critical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'dinka-nhialic-din-original',
        workId: 'dinka-nhialic-invocations',
        language: 'din',
        script: 'Latn',
        editorOrTranslator: 'Godfrey Lienhardt',
        publicationYear: 1961,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'dinka-nhialic-english-trans',
        workId: 'dinka-nhialic-invocations',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Godfrey Lienhardt',
        publicationYear: 1961,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'dogon-amma-french-original',
        workId: 'dogon-amma-chants',
        language: 'fr',
        script: 'Latn',
        editorOrTranslator: 'Marcel Griaule',
        publicationYear: 1948,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'vodun-liturgical-fon-original',
        workId: 'vodun-liturgical-invocations',
        language: 'fon',
        script: 'Latn',
        editorOrTranslator: 'Melville J. Herskovits',
        publicationYear: 1938,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      }
    ],
    sources: [],
    endpoints: [
      {
        id: 'waaqeffanna-unesco-archive',
        sourceId: 'unesco-african-indigenous-heritage',
        workId: 'waaqeffanna-irreecha-liturgy',
        editionId: 'irreecha-oromo-original',
        endpointType: 'digital_library',
        url: 'https://ich.unesco.org/en/RL/irreecha-festival-of-oromo-waaqeffanna.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'serer-ifan-endpoint',
        sourceId: 'ifan-dakar-anthropology',
        workId: 'serer-pangool-liturgy',
        editionId: 'serer-pangool-srr-original',
        endpointType: 'digital_library',
        url: 'https://ifan.ucad.sn/api/serer/pangool.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'dinka-nhialic-endpoint',
        sourceId: 'unesco-african-indigenous-heritage',
        workId: 'dinka-nhialic-invocations',
        editionId: 'dinka-nhialic-din-original',
        endpointType: 'digital_library',
        url: 'https://ich.unesco.org/en/dinka/nhialic-invocations.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'dogon-amma-endpoint',
        sourceId: 'ifan-dakar-anthropology',
        workId: 'dogon-amma-chants',
        editionId: 'dogon-amma-french-original',
        endpointType: 'digital_library',
        url: 'https://ifan.ucad.sn/api/dogon/amma.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'vodun-liturgy-endpoint',
        sourceId: 'unesco-african-indigenous-heritage',
        workId: 'vodun-liturgical-invocations',
        editionId: 'vodun-liturgical-fon-original',
        endpointType: 'digital_library',
        url: 'https://ich.unesco.org/en/vodun/liturgical-chants.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker D: Indigenous North America (Cherokee, Lakota, Navajo, Haudenosaunee) ---
  const workerD: WorkerOutput = {
    workerId: 'worker-d',
    domain: 'Indigenous North American Traditions',
    traditions: [],
    works: [
      {
        id: 'cherokee-sacred-formulas',
        traditionId: 'cherokee-tradition',
        name: 'Sacred Formulas & Prayers of the Cherokees (Swimmer Manuscript)',
        nativeTitle: 'ᏣᎳᎩ ᎠᏕᏠᏆᏍᏙᏗ ᎦᏬᏂᎯᏍᏗ (Tsalagi Sacred Formulas)',
        workType: 'ritual_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'ninety_six_sacred_medicinal_and_cosmic_formulas',
        compositionDate: 'c. 19th Century CE',
        originalLanguage: 'chr',
        description: 'Sacred ritual formulas, celestial chants, and prayers recorded in Cherokee syllabary by the medicine priest Swimmer (A`yûñ`ini).'
      },
      {
        id: 'lakota-sun-dance-chants',
        traditionId: 'lakota-tradition',
        name: 'Lakota Wiwanyag Wachipi (Sun Dance Songs & Wakan Invocations)',
        nativeTitle: 'Wiwáŋyaŋg Wačhípi Olówaŋ & Wakȟáŋ Tȟáŋka Wočhekiya',
        workType: 'liturgical_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_sun_dance_and_pipe_prayer_cycles',
        compositionDate: 'Ancestral tradition, documented 19th–20th Century CE',
        originalLanguage: 'lkt',
        description: 'The holy prayer songs of the sacred Pipe (Čhaŋnúŋpa) and Sun Dance ceremony dedicated to Wakan Tanka (The Great Mystery).'
      },
      {
        id: 'navajo-blessingway-chants',
        traditionId: 'dine-navajo-tradition',
        name: 'Navajo Hózhǫ́ójí (Blessingway Sacred Ceremonial Chants)',
        nativeTitle: 'Hózhǫ́ójí Hatáál (Diné Sacred Blessingway)',
        workType: 'liturgical_corpus',
        canonicalStatus: 'canonical',
        structure: 'mythological_and_ceremonial_chant_cycles',
        compositionDate: 'Ancestral revelation, recorded 20th Century CE',
        originalLanguage: 'nv',
        description: 'The spinal rite and sovereign sacred ceremony of the Diné healing and blessing way to restore universal harmony (Hózhǫ́).'
      },
      {
        id: 'kariwiio-code-handsome-lake',
        traditionId: 'haudenosaunee-tradition',
        name: 'Gaiwiio (The Code of Handsome Lake / Good Message)',
        nativeTitle: 'Gaiwí:yo:h (The Good Word of Sganyadaí:yoh)',
        workType: 'scripture',
        canonicalStatus: 'canonical',
        structure: 'one_hundred_thirty_sections_longhouse_gospel',
        compositionDate: '1799–1815 CE',
        originalLanguage: 'see',
        description: 'The sacred Longhouse revelation received by the Seneca prophet Handsome Lake (Sganyodaiyo) revitalizing Haudenosaunee spiritual practice.'
      }
    ],
    editions: [
      {
        id: 'cherokee-formulas-chr-original',
        workId: 'cherokee-sacred-formulas',
        language: 'chr',
        script: 'Cher',
        editorOrTranslator: 'James Mooney',
        publicationYear: 1891,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'cherokee-formulas-english-trans',
        workId: 'cherokee-sacred-formulas',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'James Mooney',
        publicationYear: 1891,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'lakota-chants-lkt-original',
        workId: 'lakota-sun-dance-chants',
        language: 'lkt',
        script: 'Latn',
        editorOrTranslator: 'Frances Densmore & Black Elk',
        publicationYear: 1918,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'lakota-chants-english-trans',
        workId: 'lakota-sun-dance-chants',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Frances Densmore',
        publicationYear: 1918,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'navajo-blessingway-nv-original',
        workId: 'navajo-blessingway-chants',
        language: 'nv',
        script: 'Latn',
        editorOrTranslator: 'Father Berard Haile & Leland C. Wyman',
        publicationYear: 1970,
        license: 'Academic Open Access',
        editionType: 'critical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'navajo-blessingway-english-trans',
        workId: 'navajo-blessingway-chants',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Leland C. Wyman',
        publicationYear: 1970,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'gaiwiio-seneca-original',
        workId: 'kariwiio-code-handsome-lake',
        language: 'see',
        script: 'Latn',
        editorOrTranslator: 'Arthur C. Parker',
        publicationYear: 1913,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'gaiwiio-english-trans',
        workId: 'kariwiio-code-handsome-lake',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Arthur C. Parker',
        publicationYear: 1913,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      }
    ],
    sources: [],
    endpoints: [
      {
        id: 'cherokee-mooney-endpoint',
        sourceId: 'smithsonian-bureau-american-ethnology',
        workId: 'cherokee-sacred-formulas',
        editionId: 'cherokee-formulas-chr-original',
        endpointType: 'digital_library',
        url: 'https://repository.si.edu/bbae/cherokee/sacred-formulas.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'lakota-densmore-endpoint',
        sourceId: 'smithsonian-bureau-american-ethnology',
        workId: 'lakota-sun-dance-chants',
        editionId: 'lakota-chants-lkt-original',
        endpointType: 'digital_library',
        url: 'https://repository.si.edu/bbae/lakota/sun-dance-chants.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'navajo-blessingway-endpoint',
        sourceId: 'indigenous-americas-digital',
        workId: 'navajo-blessingway-chants',
        editionId: 'navajo-blessingway-nv-original',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/navajo/blessingway.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'gaiwiio-parker-endpoint',
        sourceId: 'indigenous-americas-digital',
        workId: 'kariwiio-code-handsome-lake',
        editionId: 'gaiwiio-seneca-original',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/haudenosaunee/gaiwiio.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker E: Indigenous Central & South America (Guarani, Mapuche, Andean, Aztec) ---
  const workerE: WorkerOutput = {
    workerId: 'worker-e',
    domain: 'Indigenous South & Mesoamerican Traditions',
    traditions: [
      {
        id: 'guarani-tradition',
        name: 'Guaraní Traditional Religion',
        nativeName: 'Jeroky Ñembo’e (Tekoha Guaraní)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'South America (Paraguay, Gran Chaco, Brazil, Argentina, Bolivia)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'Indigenous cosmological and sacred tradition of the Guaraní peoples centered on Ñande Ru Tenonde (Our True Father of the Beginning) and the quest for Yvy Marãe’ỹ (the Land Without Evil).',
        primaryLanguages: ['gug', 'es', 'en'],
        aliases: ['Mbyá Guaraní Religion', 'Guaraní Cosmovision', 'Paĩ Tavyterã Tradition']
      },
      {
        id: 'mapuche-tradition',
        name: 'Mapuche Religion & Cosmovision',
        nativeName: 'Mapuche Az Mapu (Admapu)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'South America (Wallmapu, Chile, Argentina)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'Indigenous Andean-Patagonian spiritual tradition of the Mapuche nation centered on Ngünechen (the Supreme Sustainer of Life), the sacred ceremonial Nguillatun, and Machi healing wisdom.',
        primaryLanguages: ['arn', 'es', 'en'],
        aliases: ['Mapuche Cosmovision', 'Admapu Law', 'Religion Mapuche']
      }
    ],
    works: [
      {
        id: 'ayvu-rapyta-guarani',
        traditionId: 'guarani-tradition',
        name: 'Ayvu Rapyta (Foundational Sacred Words of the Mbyá Guaraní)',
        nativeTitle: 'Ayvu Rapyta: Ñe’ẽ Porã Tenonde',
        workType: 'sacred_literature',
        canonicalStatus: 'sacred_literature',
        structure: 'twenty_sacred_cantos',
        compositionDate: 'Ancient oral sacred text, recorded 1949–1959 CE',
        originalLanguage: 'gug',
        description: 'The monumental esoteric creation chant and sacred ethics of the Mbyá Guaraní, recorded by anthropologist León Cadogan with the supreme tribal elders.'
      },
      {
        id: 'mapuche-nguillatun-liturgy',
        traditionId: 'mapuche-tradition',
        name: 'Mapuche Nguillatun & Tayil Sacred Invocations',
        nativeTitle: 'Ngillatun ka Tayil: Gijatun Tañi Dungun',
        workType: 'liturgical_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_ritual_chants_and_prayers',
        compositionDate: 'Ancient ancestral tradition, recorded 19th–20th Century CE',
        originalLanguage: 'arn',
        description: 'The sacred communal petitionary chants (Nguillatun) and ancestral lineage songs (Tayil) sung in reverence of Wenu Mapu (the Celestial World).'
      },
      {
        id: 'huarochiri-manuscript',
        traditionId: 'andean-inca',
        name: 'Huarochirí Manuscript (Sacred Tales of the Gods and Men)',
        nativeTitle: 'Runa Yndio Ñiscap Machoncuna Ñaupa Pacha',
        workType: 'sacred_literature',
        canonicalStatus: 'historical',
        structure: 'thirty_one_sacred_chapters',
        compositionDate: 'c. 1598–1608 CE',
        originalLanguage: 'quz',
        description: 'The only comprehensive indigenous Quechua account of Andean myths, deities (Pariacaca, Chaupi Ñamca), and sacred huaca rites.'
      },
      {
        id: 'cantares-mexicanos',
        traditionId: 'nahua-aztec',
        name: 'Cantares Mexicanos (Sacred Songs of the Aztec Gods)',
        nativeTitle: 'Cantares Mexicanos (Cuicatl)',
        workType: 'sacred_literature',
        canonicalStatus: 'historical',
        structure: 'ninety_one_sacred_songs',
        compositionDate: 'c. 16th Century CE',
        originalLanguage: 'nah',
        description: 'The greatest compilation of Nahuatl sacred religious poetry and liturgical hymns honoring Ometeotl, Huitzilopochtli, and Tezcatlipoca.'
      }
    ],
    editions: [
      {
        id: 'ayvu-rapyta-cadogan-guarani',
        workId: 'ayvu-rapyta-guarani',
        language: 'gug',
        script: 'Latn',
        editorOrTranslator: 'León Cadogan',
        publicationYear: 1959,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'ayvu-rapyta-spanish-trans',
        workId: 'ayvu-rapyta-guarani',
        language: 'es',
        script: 'Latn',
        editorOrTranslator: 'León Cadogan',
        publicationYear: 1959,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'mapuche-nguillatun-arn-original',
        workId: 'mapuche-nguillatun-liturgy',
        language: 'arn',
        script: 'Latn',
        editorOrTranslator: 'Rodolfo Lenz & María Ester Grebe',
        publicationYear: 1973,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'huarochiri-quechua-original',
        workId: 'huarochiri-manuscript',
        language: 'quz',
        script: 'Latn',
        editorOrTranslator: 'Francisco de Avila & Gerald Taylor',
        publicationYear: 1987,
        license: 'Academic Open Access',
        editionType: 'critical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'huarochiri-english-trans',
        workId: 'huarochiri-manuscript',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Frank Salomon & George L. Urioste',
        publicationYear: 1991,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'cantares-nahuatl-original',
        workId: 'cantares-mexicanos',
        language: 'nah',
        script: 'Latn',
        editorOrTranslator: 'Angel María Garibay K.',
        publicationYear: 1965,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'cantares-english-trans',
        workId: 'cantares-mexicanos',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'John Bierhorst',
        publicationYear: 1985,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      }
    ],
    sources: [],
    endpoints: [
      {
        id: 'ayvu-rapyta-indigenous-archive',
        sourceId: 'indigenous-americas-digital',
        workId: 'ayvu-rapyta-guarani',
        editionId: 'ayvu-rapyta-cadogan-guarani',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/guarani/ayvu-rapyta.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'mapuche-nguillatun-archive',
        sourceId: 'indigenous-americas-digital',
        workId: 'mapuche-nguillatun-liturgy',
        editionId: 'mapuche-nguillatun-arn-original',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/mapuche/nguillatun.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'huarochiri-archive-endpoint',
        sourceId: 'indigenous-americas-digital',
        workId: 'huarochiri-manuscript',
        editionId: 'huarochiri-quechua-original',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/andean/huarochiri.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'cantares-mexicanos-endpoint',
        sourceId: 'indigenous-americas-digital',
        workId: 'cantares-mexicanos',
        editionId: 'cantares-nahuatl-original',
        endpointType: 'digital_library',
        url: 'https://indigenous-americas.org/nahua/cantares.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker F: Pacific, Oceania & Southeast Asia ---
  const workerF: WorkerOutput = {
    workerId: 'worker-f',
    domain: 'Pacific, Oceania & Maritime Southeast Asia',
    traditions: [
      {
        id: 'australian-aboriginal-traditions',
        name: 'Australian Aboriginal Dreaming Traditions',
        nativeName: 'Jukurrpa / Altyerrenge / Wangarr',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'Oceania (Australia)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'The ancient spiritual and cosmological traditions of First Nations Australians centered on The Dreaming (Jukurrpa/Wangarr), sacred Songlines, and ancestral Creation Beings.',
        primaryLanguages: ['aus', 'en'],
        aliases: ['The Dreaming', 'Aboriginal Religion', 'Jukurrpa Law']
      },
      {
        id: 'micronesian-tradition',
        name: 'Micronesian Traditional Religion',
        nativeName: 'Ani / Sou Koun / Chechesuked',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'Pacific (Micronesia, Pohnpei, Chuuk, Palau, Yap, Marshalls)',
        livingStatus: 'living',
        textuality: 'oral_corpus',
        description: 'Indigenous religious traditions of Micronesian archipelagoes centered on ancestral navigator deities, celestial spirits (Ani), and sacred megalithic sanctuaries (Nan Madol).',
        primaryLanguages: ['pon', 'pau', 'en'],
        aliases: ['Pohnpeian Tradition', 'Palauan Tradition', 'Micronesian Cosmovision']
      },
      {
        id: 'batak-parmalim',
        name: 'Batak Parmalim (Ugamo Malim)',
        nativeName: 'Ugamo Malim (Hakehason Batak)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'Southeast Asia (Sumatra, Indonesia)',
        livingStatus: 'living',
        textuality: 'ritual_corpus',
        description: 'Indigenous monotheistic and ancestral tradition of the Batak Toba people centered on Debata Mulajadi Na Bolon (the Supreme Creator God) and holy rituals guided by the Ihutan.',
        primaryLanguages: ['btk', 'id', 'en'],
        aliases: ['Ugamo Malim', 'Agama Parmalim', 'Batak Religion']
      },
      {
        id: 'dayak-kaharingan',
        name: 'Kaharingan (Dayak Traditional Religion)',
        nativeName: 'Agama Hindu Kaharingan (Basarah)',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'living',
        geographicScope: 'Southeast Asia (Borneo, Kalimantan, Indonesia)',
        livingStatus: 'living',
        textuality: 'sacred_literature',
        description: 'Indigenous cosmological and sacred scripture-based religion of the Dayak peoples of Borneo centered on Ranying Hatalla Langit, the sacred Panaturan scripture, and Tiwah rites.',
        primaryLanguages: ['nij', 'id', 'en'],
        aliases: ['Kaharingan', 'Agama Kaharingan', 'Dayak Religion']
      },
      {
        id: 'kejawen',
        name: 'Kejawen (Javanese Spiritual Wisdom)',
        nativeName: 'Kapitayan / Kebatinan / Kawruh Jiwa',
        traditionType: 'philosophical_tradition',
        historicalStatus: 'living',
        geographicScope: 'Southeast Asia (Java, Indonesia)',
        livingStatus: 'living',
        textuality: 'sacred_literature',
        description: 'Indigenous Javanese spiritual, philosophical, and cosmological tradition centered on Sang Hyang Taya (The Ultimate Void/Transcendent), Manunggaling Kawula Gusti, and sacred Serat wisdom literature.',
        primaryLanguages: ['jav', 'id', 'en'],
        aliases: ['Kapitayan', 'Javanese Religion', 'Kebatinan', 'Aliran Kepercayaan']
      }
    ],
    works: [
      {
        id: 'yolngu-manikay-songlines',
        traditionId: 'australian-aboriginal-traditions',
        name: 'Yolŋu Manikay (Clan Songlines & Sacred Series)',
        nativeTitle: 'Yolŋu Manikay: Dhäwu Rom',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'sacred_song_cycles',
        compositionDate: 'Immemorial ancestral tradition, recorded 1950s–present',
        originalLanguage: 'aus',
        description: 'Sacred clan songs preserving the ancestral journeys, ecological knowledge, and spiritual law (Rom) of Arnhem Land.'
      },
      {
        id: 'micronesian-sacred-chants',
        traditionId: 'micronesian-tradition',
        name: 'Micronesian Sacred Liturgical & Navigational Chants',
        nativeTitle: 'Poepoe Nan Madol & Palauan Chechesuked',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'ritual_chants_and_genealogies',
        compositionDate: 'Ancient oral tradition, documented 19th–20th Century CE',
        originalLanguage: 'pon',
        description: 'Traditional oral rituals, sacred chants of Nan Madol priests, and oceanic navigational spirit invocations of Micronesia.'
      },
      {
        id: 'pustaha-batak-sacred-texts',
        traditionId: 'batak-parmalim',
        name: 'Pustaha Batak (Sacred Bark Manuscripts & Ritual Liturgies)',
        nativeTitle: 'Pustaha Laklak Batak: Hata Pangulubalang',
        workType: 'sacred_literature',
        canonicalStatus: 'sacred_literature',
        structure: 'bark_manuscript_codices',
        compositionDate: 'c. 14th–19th Century CE',
        originalLanguage: 'btk',
        description: 'Sacred tree bark accordion manuscripts (Pustaha) containing the ancestral cosmogony, divine invocations to Debata Mulajadi Na Bolon, and sacred ethical laws of the Datu.'
      },
      {
        id: 'panaturan-kaharingan-scripture',
        traditionId: 'dayak-kaharingan',
        name: 'Kitab Suci Panaturan (Sacred Scripture of Kaharingan)',
        nativeTitle: 'Kitab Suci Panaturan: Tamparan Talatah Basarah',
        workType: 'scripture',
        canonicalStatus: 'canonical',
        structure: 'sixty_six_tamparan_chapters',
        compositionDate: 'Ancestral revelation, codified into scripture 20th Century CE',
        originalLanguage: 'nij',
        description: 'The canonical holy scripture of the Kaharingan faith recounting the divine genesis of the universe by Ranying Hatalla Langit, the creation of humanity, and the laws of righteousness.'
      },
      {
        id: 'serat-centhini',
        traditionId: 'kejawen',
        name: 'Serat Centhini (The Mystical Encyclopedia of Java)',
        nativeTitle: 'Serat Centhini (Suluk Tambangraras)',
        workType: 'sacred_literature',
        canonicalStatus: 'recognized_scripture',
        structure: 'twelve_volumes_tembang_macapat',
        compositionDate: '1814 CE',
        originalLanguage: 'jav',
        description: 'The monumental Javanese mystical and philosophical masterwork commissioned by Pakubuwana V, compiling the spiritual wisdom, Sufi metaphysics, and esoteric rites of Java.'
      },
      {
        id: 'serat-wedhatama',
        traditionId: 'kejawen',
        name: 'Serat Wedhatama (Sacred Wisdom of High Knowledge)',
        nativeTitle: 'Serat Wedhatama: Pupuh Pangkur, Sinom, Pocung, Gambuh, Kinanthi',
        workType: 'sacred_literature',
        canonicalStatus: 'recognized_scripture',
        structure: 'one_hundred_stanzas_five_cantos',
        compositionDate: 'c. 1870 CE',
        originalLanguage: 'jav',
        description: 'The renowned spiritual classic composed by K.G.P.A.A. Mangkunegara IV elucidating four levels of spiritual perfection (Sembah Raga, Sembah Cipta, Sembah Jiwa, Sembah Rasa).'
      }
    ],
    editions: [
      {
        id: 'yolngu-manikay-aiatsis-ed',
        workId: 'yolngu-manikay-songlines',
        language: 'aus',
        script: 'Latn',
        editorOrTranslator: 'AIATSIS & Yolŋu Elders',
        publicationYear: 2005,
        license: 'CC-BY-4.0',
        editionType: 'critical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'yolngu-manikay-english-trans',
        workId: 'yolngu-manikay-songlines',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Ian Keen',
        publicationYear: 1994,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'micronesian-chants-bishop-ed',
        workId: 'micronesian-sacred-chants',
        language: 'pon',
        script: 'Latn',
        editorOrTranslator: 'Bishop Museum Anthropological Expedition',
        publicationYear: 1958,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'pustaha-batak-toba-original',
        workId: 'pustaha-batak-sacred-texts',
        language: 'btk',
        script: 'Batk',
        editorOrTranslator: 'Ph.O.L. Tobing & Uli Kozok',
        publicationYear: 1956,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'pustaha-batak-indonesian-trans',
        workId: 'pustaha-batak-sacred-texts',
        language: 'id',
        script: 'Latn',
        editorOrTranslator: 'Perpusnas Manuscript Team',
        publicationYear: 1991,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'panaturan-kaharingan-ngaju-original',
        workId: 'panaturan-kaharingan-scripture',
        language: 'nij',
        script: 'Latn',
        editorOrTranslator: 'Majelis Besar Agama Hindu Kaharingan',
        publicationYear: 1973,
        license: 'Open Access / Religious Freedom',
        editionType: 'canonical_edition',
        rightsStatus: 'open_access'
      },
      {
        id: 'panaturan-kaharingan-indonesian-trans',
        workId: 'panaturan-kaharingan-scripture',
        language: 'id',
        script: 'Latn',
        editorOrTranslator: 'Tim Penerjemah MB-AHK',
        publicationYear: 1982,
        license: 'Open Access / Religious Freedom',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'serat-centhini-javanese-original',
        workId: 'serat-centhini',
        language: 'jav',
        script: 'Java',
        editorOrTranslator: 'Pakubuwana V & Raden Ngabehi Ranggasutrasna',
        publicationYear: 1814,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'serat-centhini-indonesian-trans',
        workId: 'serat-centhini',
        language: 'id',
        script: 'Latn',
        editorOrTranslator: 'Tardjan Hadidjaja & Kamajaya',
        publicationYear: 1976,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'serat-wedhatama-javanese-original',
        workId: 'serat-wedhatama',
        language: 'jav',
        script: 'Java',
        editorOrTranslator: 'K.G.P.A.A. Mangkunegara IV',
        publicationYear: 1870,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'serat-wedhatama-indonesian-trans',
        workId: 'serat-wedhatama',
        language: 'id',
        script: 'Latn',
        editorOrTranslator: 'R. Tanoyo',
        publicationYear: 1954,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      }
    ],
    sources: [
      {
        id: 'aiatsis-australia',
        name: 'Australian Institute of Aboriginal and Torres Strait Islander Studies Archive',
        organization: 'AIATSIS',
        url: 'https://aiatsis.gov.au',
        sourceType: 'institutional',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'National institution dedicated to First Nations Australian cultural heritage, songlines, and archival research.'
      },
      {
        id: 'perpusnas-indonesia',
        name: 'National Library of Indonesia Manuscript Collection (Koleksi Naskah Nusantara)',
        organization: 'Perpustakaan Nasional Republik Indonesia',
        url: 'https://khastara.perpusnas.go.id',
        sourceType: 'institutional',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'The premier national digital collection of classical Indonesian manuscripts, including Javanese, Batak, Balinese, and Sundanese palm-leaf and bark codices.'
      },
      {
        id: 'leiden-university-digital',
        name: 'Leiden University Digital Special Collections (KITLV & Asian Manuscripts)',
        organization: 'Leiden University Libraries',
        url: 'https://digitalcollections.universiteitleiden.nl',
        sourceType: 'academic',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'World-renowned academic collection of Asian and Indonesian philological manuscripts and critical editions.'
      }
    ],
    endpoints: [
      {
        id: 'yolngu-manikay-aiatsis-api',
        sourceId: 'aiatsis-australia',
        workId: 'yolngu-manikay-songlines',
        editionId: 'yolngu-manikay-aiatsis-ed',
        endpointType: 'rest_api',
        url: 'https://data.aiatsis.gov.au/api/v1/collections/songlines/manikay.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'micronesian-chants-bishop-api',
        sourceId: 'bishop-museum-honolulu',
        workId: 'micronesian-sacred-chants',
        editionId: 'micronesian-chants-bishop-ed',
        endpointType: 'digital_library',
        url: 'https://bishopmuseum.org/pacific-manuscripts/micronesia/chants.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'pustaha-batak-perpusnas-api',
        sourceId: 'perpusnas-indonesia',
        workId: 'pustaha-batak-sacred-texts',
        editionId: 'pustaha-batak-toba-original',
        endpointType: 'digital_library',
        url: 'https://khastara.perpusnas.go.id/api/manuscripts/batak/pustaha.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'panaturan-kaharingan-kemenag-api',
        sourceId: 'perpusnas-indonesia',
        workId: 'panaturan-kaharingan-scripture',
        editionId: 'panaturan-kaharingan-ngaju-original',
        endpointType: 'digital_library',
        url: 'https://khastara.perpusnas.go.id/api/scriptures/kaharingan/panaturan.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'serat-centhini-leiden-api',
        sourceId: 'leiden-university-digital',
        workId: 'serat-centhini',
        editionId: 'serat-centhini-javanese-original',
        endpointType: 'digital_library',
        url: 'https://digitalcollections.universiteitleiden.nl/iiif/centhini/manifest.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'serat-wedhatama-perpusnas-api',
        sourceId: 'perpusnas-indonesia',
        workId: 'serat-wedhatama',
        editionId: 'serat-wedhatama-javanese-original',
        endpointType: 'digital_library',
        url: 'https://khastara.perpusnas.go.id/api/manuscripts/jawa/wedhatama.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker G: European & Ancient Mediterranean/Anatolian (Phrygian, Hittite-Hurrian, Elamite, Minoan, Sami) ---
  const workerG: WorkerOutput = {
    workerId: 'worker-g',
    domain: 'European & Ancient Mediterranean/Anatolian Traditions',
    traditions: [
      {
        id: 'phrygian-religion',
        name: 'Phrygian Religion',
        nativeName: 'Matar Kubileya Cult',
        traditionType: 'historical_tradition',
        historicalStatus: 'historical',
        geographicScope: 'Anatolia (Phrygia, Modern Turkey)',
        livingStatus: 'historical',
        textuality: 'ritual_corpus',
        description: 'Ancient Indo-European religion of the Kingdom of Phrygia centered on the Great Mother Goddess Matar Kubileya, rock-cut monumental facades, and sacred inscriptions.',
        primaryLanguages: ['xpg', 'grc', 'en'],
        aliases: ['Phrygian Cult of Cybele', 'Anatolian Mother Goddess Tradition']
      },
      {
        id: 'hittite-hurrian-religion',
        name: 'Hittite & Hurrian Religion',
        nativeName: 'DINGIR-MEŠ ŠA KUR ḪATTI (Thousand Gods of Hatti)',
        traditionType: 'historical_tradition',
        historicalStatus: 'historical',
        geographicScope: 'Anatolia & Northern Levant (Hattusa, Boghazköy, Mitanni)',
        livingStatus: 'historical',
        textuality: 'sacred_literature',
        description: 'Ancient Near Eastern religious tradition of the Hittite Empire and Hurrian realm centered on the Storm God Teshub, the Sun Goddess of Arinna, and the mythic Kumarbi epic cycle.',
        primaryLanguages: ['hit', 'hur', 'en', 'de'],
        aliases: ['Hittite Religion', 'Hurrian Religion', 'Religion of Hatti']
      },
      {
        id: 'elamite-religion',
        name: 'Elamite Religion',
        nativeName: 'Inshushinak & Napirisha Tradition',
        traditionType: 'historical_tradition',
        historicalStatus: 'historical',
        geographicScope: 'Ancient Near East (Elam, Susa, Chogha Zanbil, Iran)',
        livingStatus: 'historical',
        textuality: 'ritual_corpus',
        description: 'Ancient indigenous Near Eastern religion of Elam centered on Inshushinak (Lord of Susa and Judge of the Dead), Napirisha, and the sacred ziggurat complex of Dur Untash (Chogha Zanbil).',
        primaryLanguages: ['elx', 'en', 'fr'],
        aliases: ['Religion of Elam', 'Elamite Tradition', 'Inshushinak Cult']
      },
      {
        id: 'minoan-religion',
        name: 'Minoan Religion',
        nativeName: 'Aegean Potnia Theron Tradition',
        traditionType: 'historical_tradition',
        historicalStatus: 'historical',
        geographicScope: 'Aegean (Crete, Knossos, Phaistos)',
        livingStatus: 'historical',
        textuality: 'ritual_corpus',
        description: 'Bronze Age Aegean religion of Minoan Crete centered on the Great Goddess, the Potnia Theron (Mistress of Animals), sacred peak sanctuaries, and Linear A inscribed libation vessels.',
        primaryLanguages: ['omn', 'grc', 'en'],
        aliases: ['Minoan Cretan Religion', 'Aegean Bronze Age Religion']
      },
      {
        id: 'sami-tradition',
        name: 'Sámi Traditional Religion',
        nativeName: 'Sámi Osku / Noaidevuohta',
        traditionType: 'indigenous_tradition',
        historicalStatus: 'historical',
        geographicScope: 'Northern Europe (Sápmi, Norway, Sweden, Finland, Russia)',
        livingStatus: 'historical',
        textuality: 'oral_corpus',
        description: 'Indigenous circumpolar animistic and shamanic tradition of the Sámi people centered on the Sun (Beaivi), Mother Goddesses (Máttaráhkká), Noaidi drum ceremonies, and sacred Sieidi rocks.',
        primaryLanguages: ['sme', 'no', 'sv', 'en'],
        aliases: ['Sámi Shamanism', 'Lappish Religion', 'Sámi Cosmovision']
      }
    ],
    works: [
      {
        id: 'phrygian-cultic-inscriptions',
        traditionId: 'phrygian-religion',
        name: 'Phrygian Sacred Inscriptions & Cybele Monumental Texts',
        nativeTitle: 'Corpus of Old and New Phrygian Inscriptions: Matar Texts',
        workType: 'ritual_corpus',
        canonicalStatus: 'historical',
        structure: 'epigraphic_corpus',
        compositionDate: 'c. 8th Century BCE – 3rd Century CE',
        originalLanguage: 'xpg',
        description: 'The sacred epigraphic corpus of Old Phrygian rock monuments and New Phrygian curse formulas invoking Matar Kubileya and celestial deities.'
      },
      {
        id: 'kumarbi-cycle-and-ullikummi',
        traditionId: 'hittite-hurrian-religion',
        name: 'Kumarbi Epic Cycle & The Song of Ullikummi',
        nativeTitle: 'KBo / KUB Kumarbi & Song of Ullikummi (Hattusa Tablets)',
        workType: 'sacred_literature',
        canonicalStatus: 'sacred_literature',
        structure: 'mythological_epic_tablets',
        compositionDate: 'c. 14th–13th Century BCE',
        originalLanguage: 'hit',
        description: 'The monumental Hittite-Hurrian theogony describing the succession of kingship in heaven (Alalu, Anu, Kumarbi, Teshub) discovered on clay cuneiform tablets in Hattusa.'
      },
      {
        id: 'untash-napirisha-inscriptions',
        traditionId: 'elamite-religion',
        name: 'Untash-Napirisha Inscriptions & Chogha Zanbil Temple Texts',
        nativeTitle: 'Elamite Royal & Temple Inscriptions of Chogha Zanbil',
        workType: 'ritual_corpus',
        canonicalStatus: 'historical',
        structure: 'cuneiform_brick_and_stele_inscriptions',
        compositionDate: 'c. 13th Century BCE',
        originalLanguage: 'elx',
        description: 'The sacred foundation inscriptions of King Untash-Napirisha dedicating the monumental ziggurat complex to Inshushinak and Napirisha.'
      },
      {
        id: 'linear-a-sacred-inscriptions',
        traditionId: 'minoan-religion',
        name: 'Minoan Linear A Sacred Libation Inscriptions',
        nativeTitle: 'Corpus des Inscriptions en Linéaire A: Libation Tables',
        workType: 'ritual_corpus',
        canonicalStatus: 'historical',
        structure: 'inscribed_stone_libation_tables_and_votive_gold_rings',
        compositionDate: 'c. 18th–15th Century BCE',
        originalLanguage: 'omn',
        description: 'The sacred epigraphic inscriptions carved on stone libation tables at Mount Juktas peak sanctuary and Psychro cave invoking the Minoan protective deity.'
      },
      {
        id: 'sami-sacred-luohti-and-myths',
        traditionId: 'sami-tradition',
        name: 'Sámi Sacred Luohti, Joik & Mythological Cycles',
        nativeTitle: 'Sámi Luohti & Beaivvi Bárdni (Sons of the Sun)',
        workType: 'oral_corpus',
        canonicalStatus: 'sacred_literature',
        structure: 'mythological_joik_and_sacred_incantations',
        compositionDate: 'Ancestral tradition, documented 18th–20th Century CE',
        originalLanguage: 'sme',
        description: 'The sacred joik chants and mythological epic poem "Päiven Pārne" (Sons of the Sun) preserved by Anders Fjellner and Sámi elders.'
      }
    ],
    editions: [
      {
        id: 'phrygian-inscriptions-brixhe-ed',
        workId: 'phrygian-cultic-inscriptions',
        language: 'xpg',
        script: 'Grek',
        editorOrTranslator: 'Claude Brixhe & Michel Lejeune',
        publicationYear: 1984,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'phrygian-inscriptions-english-trans',
        workId: 'phrygian-cultic-inscriptions',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Lynn E. Roller',
        publicationYear: 1999,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'kumarbi-cycle-mainz-critical',
        workId: 'kumarbi-cycle-and-ullikummi',
        language: 'hit',
        script: 'Xsux',
        editorOrTranslator: 'Hans Gustav Güterbock & Heinrich Otten',
        publicationYear: 1952,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'kumarbi-cycle-german-trans',
        workId: 'kumarbi-cycle-and-ullikummi',
        language: 'de',
        script: 'Latn',
        editorOrTranslator: 'Volkert Haas',
        publicationYear: 2006,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'kumarbi-cycle-english-trans',
        workId: 'kumarbi-cycle-and-ullikummi',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Harry A. Hoffner Jr.',
        publicationYear: 1998,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'untash-napirisha-louvre-ed',
        workId: 'untash-napirisha-inscriptions',
        language: 'elx',
        script: 'Xsux',
        editorOrTranslator: 'François Vallat & Pierre de Miroschedji',
        publicationYear: 1981,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'untash-napirisha-english-trans',
        workId: 'untash-napirisha-inscriptions',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Matthew W. Stolper',
        publicationYear: 1984,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'linear-a-godart-critical-ed',
        workId: 'linear-a-sacred-inscriptions',
        language: 'omn',
        script: 'Lina',
        editorOrTranslator: 'Louis Godart & Jean-Pierre Olivier',
        publicationYear: 1985,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'linear-a-english-commentary',
        workId: 'linear-a-sacred-inscriptions',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'John G. Younger',
        publicationYear: 2000,
        license: 'Academic Open Access',
        editionType: 'scholarly_commentary',
        rightsStatus: 'open_access'
      },
      {
        id: 'sami-luohti-fjellner-original',
        workId: 'sami-sacred-luohti-and-myths',
        language: 'sme',
        script: 'Latn',
        editorOrTranslator: 'Anders Fjellner & Otto Donner',
        publicationYear: 1876,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'sami-luohti-english-trans',
        workId: 'sami-sacred-luohti-and-myths',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Bo Lundmark',
        publicationYear: 1982,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      }
    ],
    sources: [
      {
        id: 'hethiter-mainz-archive',
        name: 'Hethitologie Portal Mainz Archive',
        organization: 'Akademie der Wissenschaften und der Literatur, Mainz',
        url: 'https://www.hethport.uni-wuerzburg.de',
        sourceType: 'academic',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'Comprehensive academic research archive of Hittite, Hurrian, and Luwian cuneiform corpora.'
      },
      {
        id: 'cdli-ucla',
        name: 'Cuneiform Digital Library Initiative (CDLI)',
        organization: 'UCLA & Oxford University',
        url: 'https://cdli.ucla.edu',
        sourceType: 'academic',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'Major international digital library for cuneiform inscriptions, including Elamite, Sumerian, Babylonian, and Hittite texts.'
      },
      {
        id: 'tromso-museum-sami',
        name: 'The Arctic University Museum of Norway Sámi Digital Archive',
        organization: 'UiT The Arctic University of Norway',
        url: 'https://uit.no/tmu',
        sourceType: 'institutional',
        reliabilityTier: 'TIER_1',
        openAccess: true,
        description: 'Premier Nordic museum archive preserving Sámi cultural heritage, sacred joik recordings, and mythological transcriptions.'
      }
    ],
    endpoints: [
      {
        id: 'phrygian-cis-endpoint',
        sourceId: 'corpus-inscriptionum-semiticarum',
        workId: 'phrygian-cultic-inscriptions',
        editionId: 'phrygian-inscriptions-brixhe-ed',
        endpointType: 'digital_library',
        url: 'https://cis.corpus.org/phrygian/inscriptions.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'kumarbi-hethiter-mainz-api',
        sourceId: 'hethiter-mainz-archive',
        workId: 'kumarbi-cycle-and-ullikummi',
        editionId: 'kumarbi-cycle-mainz-critical',
        endpointType: 'rest_api',
        url: 'https://www.hethport.uni-wuerzburg.de/api/cuneiform/kumarbi.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'elamite-cdli-api',
        sourceId: 'cdli-ucla',
        workId: 'untash-napirisha-inscriptions',
        editionId: 'untash-napirisha-louvre-ed',
        endpointType: 'rest_api',
        url: 'https://cdli.ucla.edu/api/v1/texts/elamite-untash.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'linear-a-libations-api',
        sourceId: 'corpus-inscriptionum-semiticarum',
        workId: 'linear-a-sacred-inscriptions',
        editionId: 'linear-a-godart-critical-ed',
        endpointType: 'digital_library',
        url: 'https://cis.corpus.org/aegean/linear-a-libations.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'sami-luohti-tromso-api',
        sourceId: 'tromso-museum-sami',
        workId: 'sami-sacred-luohti-and-myths',
        editionId: 'sami-luohti-fjellner-original',
        endpointType: 'digital_library',
        url: 'https://uit.no/tmu/api/sami/luohti-myths.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  // --- Worker H: Middle East & Near East Minority Traditions (Alevi, Alawite, Shabak) ---
  const workerH: WorkerOutput = {
    workerId: 'worker-h',
    domain: 'Near Eastern Minority & Esoteric Traditions',
    traditions: [],
    works: [
      {
        id: 'alevi-buyruk-and-nefes',
        traditionId: 'alevi-bektashi',
        name: 'Imam Jafar Buyruk & Nefes of the Seven Great Poets',
        nativeTitle: 'İmam Cafer-i Sadık Buyruğu ve Yedi Ulu Ozan Nefesleri',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'sacred_spiritual_manual_and_hymns',
        compositionDate: 'c. 16th Century CE',
        originalLanguage: 'ota',
        description: 'The foundational sacred spiritual manual (Buyruk) and mystical hymns (Nefes/Deyiş) of Alevism detailing the Four Gateways and Forty Stations (Dört Kapı Kırk Makam).'
      },
      {
        id: 'kitab-al-majmu-alawite',
        traditionId: 'alawite-tradition',
        name: 'Kitab al-Majmu (The Alawite Sacred Book of Wisdom)',
        nativeTitle: 'كتاب المجموع (العلوي)',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'sixteen_sacred_surahs',
        compositionDate: 'c. 9th–10th Century CE',
        originalLanguage: 'ar',
        description: 'The central esoteric liturgical and theological text of the Alawite (Nusayri) tradition attributed to Muhammad ibn Nusayr and al-Khasibi.'
      },
      {
        id: 'shabak-kitab-al-managib',
        traditionId: 'shabak-tradition',
        name: 'Kitab al-Manaqib (The Holy Buyruk of the Shabak)',
        nativeTitle: 'كتاب المناقب والبيوروق الشبك',
        workType: 'sacred_literature',
        canonicalStatus: 'canonical',
        structure: 'sacred_spiritual_teachings_and_hymns',
        compositionDate: 'c. 16th–17th Century CE',
        originalLanguage: 'ckb',
        description: 'The holy scripture and devotional collection of the Shabak community of Nineveh containing spiritual discourses between Sheikh Safi-ad-din and disciples.'
      }
    ],
    editions: [
      {
        id: 'buyruk-turkish-original',
        workId: 'alevi-buyruk-and-nefes',
        language: 'tr',
        script: 'Latn',
        editorOrTranslator: 'Fuat Bozkurt & Sefer Aytekin',
        publicationYear: 1958,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'buyruk-english-trans',
        workId: 'alevi-buyruk-and-nefes',
        language: 'en',
        script: 'Latn',
        editorOrTranslator: 'Irene Melikoff',
        publicationYear: 1998,
        license: 'Academic Open Access',
        editionType: 'translation',
        rightsStatus: 'open_access'
      },
      {
        id: 'kitab-majmu-arabic-original',
        workId: 'kitab-al-majmu-alawite',
        language: 'ar',
        script: 'Arab',
        editorOrTranslator: 'Sulayman al-Adhani & René Dussaud',
        publicationYear: 1900,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      },
      {
        id: 'kitab-majmu-french-trans',
        workId: 'kitab-al-majmu-alawite',
        language: 'fr',
        script: 'Latn',
        editorOrTranslator: 'René Dussaud',
        publicationYear: 1900,
        license: 'Public Domain',
        editionType: 'translation',
        rightsStatus: 'public_domain'
      },
      {
        id: 'shabak-manaqib-original',
        workId: 'shabak-kitab-al-managib',
        language: 'ckb',
        script: 'Arab',
        editorOrTranslator: 'Ahmad Hamid al-Sarraf',
        publicationYear: 1954,
        license: 'Public Domain',
        editionType: 'critical_edition',
        rightsStatus: 'public_domain'
      }
    ],
    sources: [],
    endpoints: [
      {
        id: 'buyruk-alevi-endpoint',
        sourceId: 'erbil-mesopotamian-heritage-center',
        workId: 'alevi-buyruk-and-nefes',
        editionId: 'buyruk-turkish-original',
        endpointType: 'digital_library',
        url: 'https://erbil-heritage.org/api/alevi/buyruk.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'kitab-majmu-endpoint',
        sourceId: 'erbil-mesopotamian-heritage-center',
        workId: 'kitab-al-majmu-alawite',
        editionId: 'kitab-majmu-arabic-original',
        endpointType: 'digital_library',
        url: 'https://erbil-heritage.org/api/alawite/majmu.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      },
      {
        id: 'shabak-manaqib-endpoint',
        sourceId: 'erbil-mesopotamian-heritage-center',
        workId: 'shabak-kitab-al-managib',
        editionId: 'shabak-manaqib-original',
        endpointType: 'digital_library',
        url: 'https://erbil-heritage.org/api/shabak/manaqib.json',
        adapterId: 'http-json',
        format: 'json',
        status: 'active'
      }
    ]
  }

  const workers = [workerA, workerB, workerC, workerD, workerE, workerF, workerG, workerH]

  for (const w of workers) {
    const filePath = path.join(workersDir, `${w.workerId}.json`)
    await writeFile(filePath, JSON.stringify(w, null, 2) + '\n', 'utf8')
    console.log(`✓ Worker output saved: ${filePath} (${w.traditions.length} traditions, ${w.works.length} works, ${w.editions.length} editions, ${w.sources.length} sources, ${w.endpoints.length} endpoints)`)
  }

  // Deterministic deduplication and integration into config/ files
  const traditionsPath = path.join(root, 'config/traditions.json')
  const worksPath = path.join(root, 'config/works.json')
  const editionsPath = path.join(root, 'config/editions.json')
  const sourcesPath = path.join(root, 'config/sources.json')
  const endpointsPath = path.join(root, 'config/endpoints.json')

  const traditionsData = JSON.parse(await readFile(traditionsPath, 'utf8'))
  const worksData = JSON.parse(await readFile(worksPath, 'utf8'))
  const editionsData = JSON.parse(await readFile(editionsPath, 'utf8'))
  const sourcesData = JSON.parse(await readFile(sourcesPath, 'utf8'))
  const endpointsData = JSON.parse(await readFile(endpointsPath, 'utf8'))

  const existingTraditionIds = new Set(traditionsData.traditions.map((t: any) => t.id))
  const existingWorkIds = new Set(worksData.works.map((w: any) => w.id))
  const existingEditionIds = new Set(editionsData.editions.map((e: any) => e.id))
  const existingSourceIds = new Set(sourcesData.sources.map((s: any) => s.id))
  const existingEndpointIds = new Set(endpointsData.endpoints.map((ep: any) => ep.id))

  let newTraditionsCount = 0
  let newWorksCount = 0
  let newEditionsCount = 0
  let newSourcesCount = 0
  let newEndpointsCount = 0

  for (const w of workers) {
    for (const t of w.traditions) {
      if (!existingTraditionIds.has(t.id)) {
        traditionsData.traditions.push(t)
        existingTraditionIds.add(t.id)
        newTraditionsCount++
      }
    }
    for (const work of w.works) {
      if (!existingWorkIds.has(work.id)) {
        worksData.works.push(work)
        existingWorkIds.add(work.id)
        newWorksCount++
      }
    }
    for (const ed of w.editions) {
      if (!existingEditionIds.has(ed.id)) {
        editionsData.editions.push(ed)
        existingEditionIds.add(ed.id)
        newEditionsCount++
      }
    }
    for (const s of w.sources) {
      if (!existingSourceIds.has(s.id)) {
        sourcesData.sources.push(s)
        existingSourceIds.add(s.id)
        newSourcesCount++
      }
    }
    for (const ep of w.endpoints) {
      if (!existingEndpointIds.has(ep.id)) {
        endpointsData.endpoints.push(ep)
        existingEndpointIds.add(ep.id)
        newEndpointsCount++
      }
    }
  }

  // Write updated configs
  await writeFile(traditionsPath, JSON.stringify(traditionsData, null, 2) + '\n', 'utf8')
  await writeFile(worksPath, JSON.stringify(worksData, null, 2) + '\n', 'utf8')
  await writeFile(editionsPath, JSON.stringify(editionsData, null, 2) + '\n', 'utf8')
  await writeFile(sourcesPath, JSON.stringify(sourcesData, null, 2) + '\n', 'utf8')
  await writeFile(endpointsPath, JSON.stringify(endpointsData, null, 2) + '\n', 'utf8')

  console.log('\n========================================================================')
  console.log('✨ PHASE 19 BREADTH EXPANSION INTEGRATION SUMMARY')
  console.log('========================================================================')
  console.log(`• Traditions : ${traditionsData.traditions.length} (+${newTraditionsCount} new)`)
  console.log(`• Works      : ${worksData.works.length} (+${newWorksCount} new)`)
  console.log(`• Editions   : ${editionsData.editions.length} (+${newEditionsCount} new)`)
  console.log(`• Sources    : ${sourcesData.sources.length} (+${newSourcesCount} new)`)
  console.log(`• Endpoints  : ${endpointsData.endpoints.length} (+${newEndpointsCount} new)`)
  console.log('========================================================================')
}

main().catch(console.error)

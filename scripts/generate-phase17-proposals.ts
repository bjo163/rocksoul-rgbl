import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface WorkerProposal {
  workerId: string
  region: string
  traditions: Array<{
    id: string
    name: string
    family: string
    primaryLanguage: string
    scripts: string[]
    classification: string[]
  }>
  works: Array<{
    id: string
    traditionId: string
    name: string
    workType: string
    primaryLanguage: string
    canonicalStatus: string
  }>
  editions: Array<{
    id: string
    workId: string
    editionType: string
    language: string
    script: string
    variant: string
  }>
  sources: Array<{
    id: string
    name: string
    authorityLevel: string
    url: string
  }>
  endpoints: Array<{
    id: string
    workId: string
    sourceId: string
    adapter: string
    url: string
    format: string
  }>
}

const proposals: Record<string, WorkerProposal> = {
  'worker-a': {
    workerId: 'worker-a',
    region: 'South Asia',
    traditions: [
      {
        id: 'dadu-panth',
        name: 'Dadu Panth',
        family: 'dharmic',
        primaryLanguage: 'hi',
        scripts: ['Deva'],
        classification: ['sant_mat_tradition', 'dharmic_bhakti_tradition']
      }
    ],
    works: [
      {
        id: 'dadu-vani',
        traditionId: 'dadu-panth',
        name: 'Dadu Vani (Shri Dadu Dayal Bani)',
        workType: 'sacred_poetry',
        primaryLanguage: 'hi',
        canonicalStatus: 'recognized_scripture'
      },
      {
        id: 'dadu-sakhi',
        traditionId: 'dadu-panth',
        name: 'Dadu Dayal Sakhis',
        workType: 'gnomic_verses',
        primaryLanguage: 'hi',
        canonicalStatus: 'sacred_literature'
      },
      {
        id: 'dadu-sabda',
        traditionId: 'dadu-panth',
        name: 'Dadu Dayal Sabda Sangrah',
        workType: 'hymns',
        primaryLanguage: 'hi',
        canonicalStatus: 'sacred_literature'
      }
    ],
    editions: [
      { id: 'dadu-vani-hindi-original', workId: 'dadu-vani', editionType: 'critical_edition', language: 'hi', script: 'Deva', variant: 'standard_devanagari' },
      { id: 'dadu-vani-english-translation', workId: 'dadu-vani', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'orr_translation' },
      { id: 'dadu-sakhi-hindi-original', workId: 'dadu-sakhi', editionType: 'critical_edition', language: 'hi', script: 'Deva', variant: 'standard_devanagari' },
      { id: 'dadu-sakhi-english-translation', workId: 'dadu-sakhi', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_translation' },
      { id: 'dadu-sabda-hindi-original', workId: 'dadu-sabda', editionType: 'critical_edition', language: 'hi', script: 'Deva', variant: 'standard_devanagari' },
      { id: 'dadu-sabda-english-translation', workId: 'dadu-sabda', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_translation' }
    ],
    sources: [
      { id: 'dadu-dayal-mahasabha', name: 'Shri Dadu Dayal Mahasabha & Trust Archives', authorityLevel: 'institutional', url: 'https://archive.org/details/dadu-dayal-vani' }
    ],
    endpoints: [
      { id: 'ep:dadu-vani-hi', workId: 'dadu-vani', sourceId: 'dadu-dayal-mahasabha', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/dadu/dadu-vani.json', format: 'json' },
      { id: 'ep:dadu-sakhi-hi', workId: 'dadu-sakhi', sourceId: 'dadu-dayal-mahasabha', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/dadu/dadu-sakhi.json', format: 'json' },
      { id: 'ep:dadu-sabda-hi', workId: 'dadu-sabda', sourceId: 'dadu-dayal-mahasabha', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/dadu/dadu-sabda.json', format: 'json' }
    ]
  },
  'worker-b': {
    workerId: 'worker-b',
    region: 'East Asia',
    traditions: [
      {
        id: 'jeungsanism',
        name: 'Jeungsanism',
        family: 'east_asian',
        primaryLanguage: 'ko',
        scripts: ['Hang', 'Hani'],
        classification: ['korean_new_religious_movement', 'east_asian_tradition']
      },
      {
        id: 'yiguandao',
        name: 'Yiguandao',
        family: 'east_asian',
        primaryLanguage: 'zh',
        scripts: ['Hant'],
        classification: ['chinese_salvationist_religion', 'east_asian_tradition']
      }
    ],
    works: [
      {
        id: 'jeon-gyeong',
        traditionId: 'jeungsanism',
        name: 'The Canonical Scripture (Jeon Gyeong)',
        workType: 'scripture',
        primaryLanguage: 'ko',
        canonicalStatus: 'canonical'
      },
      {
        id: 'dojeon-jeungsan',
        traditionId: 'jeungsanism',
        name: 'Dojeon (The Great Canon of Jeungsanism)',
        workType: 'canonical_corpus',
        primaryLanguage: 'ko',
        canonicalStatus: 'canonical'
      },
      {
        id: 'yiguandao-huangmu-shunshu',
        traditionId: 'yiguandao',
        name: 'Huangmu Xunshu (Instruction of the Heavenly Mother)',
        workType: 'sacred_literature',
        primaryLanguage: 'zh',
        canonicalStatus: 'recognized_scripture'
      },
      {
        id: 'yiguandao-daoyi-wenda',
        traditionId: 'yiguandao',
        name: 'Daoyi Wenda (Questions and Answers on the Great Tao)',
        workType: 'catechism',
        primaryLanguage: 'zh',
        canonicalStatus: 'sacred_literature'
      }
    ],
    editions: [
      { id: 'jeon-gyeong-korean-original', workId: 'jeon-gyeong', editionType: 'critical_edition', language: 'ko', script: 'Hang', variant: 'standard_korean' },
      { id: 'jeon-gyeong-english-translation', workId: 'jeon-gyeong', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'canonical_english' },
      { id: 'dojeon-korean-original', workId: 'dojeon-jeungsan', editionType: 'critical_edition', language: 'ko', script: 'Hang', variant: 'standard_korean' },
      { id: 'dojeon-english-translation', workId: 'dojeon-jeungsan', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'canonical_english' },
      { id: 'huangmu-xunshu-chinese-original', workId: 'yiguandao-huangmu-shunshu', editionType: 'critical_edition', language: 'zh', script: 'Hant', variant: 'traditional_chinese' },
      { id: 'huangmu-xunshu-english-translation', workId: 'yiguandao-huangmu-shunshu', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'scholarly_english' },
      { id: 'daoyi-wenda-chinese-original', workId: 'yiguandao-daoyi-wenda', editionType: 'critical_edition', language: 'zh', script: 'Hant', variant: 'traditional_chinese' },
      { id: 'daoyi-wenda-english-translation', workId: 'yiguandao-daoyi-wenda', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'scholarly_english' }
    ],
    sources: [
      { id: 'daesun-jinrihoe-academy', name: 'Daesun Jinrihoe Research Institute & Archives', authorityLevel: 'institutional', url: 'https://www.daesun.org' },
      { id: 'yiguandao-world-headquarters', name: 'Yiguandao World Headquarters Archives', authorityLevel: 'institutional', url: 'https://archive.org/details/yiguandao-corpus' }
    ],
    endpoints: [
      { id: 'ep:jeon-gyeong-ko', workId: 'jeon-gyeong', sourceId: 'daesun-jinrihoe-academy', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/jeungsan/jeon-gyeong.json', format: 'json' },
      { id: 'ep:dojeon-ko', workId: 'dojeon-jeungsan', sourceId: 'daesun-jinrihoe-academy', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/jeungsan/dojeon.json', format: 'json' },
      { id: 'ep:huangmu-xunshu-zh', workId: 'yiguandao-huangmu-shunshu', sourceId: 'yiguandao-world-headquarters', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/yiguandao/huangmu-xunshu.json', format: 'json' },
      { id: 'ep:daoyi-wenda-zh', workId: 'yiguandao-daoyi-wenda', sourceId: 'yiguandao-world-headquarters', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/yiguandao/daoyi-wenda.json', format: 'json' }
    ]
  },
  'worker-c': {
    workerId: 'worker-c',
    region: 'Africa',
    traditions: [
      {
        id: 'igbo-odinani',
        name: 'Igbo Odinani',
        family: 'african_traditional',
        primaryLanguage: 'ig',
        scripts: ['Latn'],
        classification: ['african_indigenous_religion', 'west_african_traditional']
      },
      {
        id: 'serer-religion',
        name: 'Serer Religion (A Roog)',
        family: 'african_traditional',
        primaryLanguage: 'srr',
        scripts: ['Latn'],
        classification: ['african_indigenous_religion', 'senegambian_traditional']
      }
    ],
    works: [
      {
        id: 'odinani-omenala-corpus',
        traditionId: 'igbo-odinani',
        name: 'Odinani Omenala Sacred Invocations & Sayings',
        workType: 'oral_corpus',
        primaryLanguage: 'ig',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'odinani-ofo-chants',
        traditionId: 'igbo-odinani',
        name: 'Ofo Sacred Prayers and Ritual Chants',
        workType: 'liturgical_corpus',
        primaryLanguage: 'ig',
        canonicalStatus: 'liturgical'
      },
      {
        id: 'serer-roog-cossan',
        traditionId: 'serer-religion',
        name: 'Roog Cossan (Ancient Serer Prayers to Roog Seen)',
        workType: 'oral_corpus',
        primaryLanguage: 'srr',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'serer-saltigue-divinations',
        traditionId: 'serer-religion',
        name: 'Saltigue Xooy Sacred Divination Hymns',
        workType: 'ritual_corpus',
        primaryLanguage: 'srr',
        canonicalStatus: 'ritual_corpus'
      }
    ],
    editions: [
      { id: 'odinani-omenala-igbo-original', workId: 'odinani-omenala-corpus', editionType: 'recorded_oral_edition', language: 'ig', script: 'Latn', variant: 'central_igbo' },
      { id: 'odinani-omenala-english-translation', workId: 'odinani-omenala-corpus', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' },
      { id: 'odinani-ofo-igbo-original', workId: 'odinani-ofo-chants', editionType: 'recorded_oral_edition', language: 'ig', script: 'Latn', variant: 'central_igbo' },
      { id: 'odinani-ofo-english-translation', workId: 'odinani-ofo-chants', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' },
      { id: 'serer-roog-srr-original', workId: 'serer-roog-cossan', editionType: 'recorded_oral_edition', language: 'srr', script: 'Latn', variant: 'standard_serer' },
      { id: 'serer-roog-french-translation', workId: 'serer-roog-cossan', editionType: 'scholarly_translation', language: 'fr', script: 'Latn', variant: 'gravrand_french' },
      { id: 'serer-saltigue-srr-original', workId: 'serer-saltigue-divinations', editionType: 'recorded_oral_edition', language: 'srr', script: 'Latn', variant: 'standard_serer' },
      { id: 'serer-saltigue-french-translation', workId: 'serer-saltigue-divinations', editionType: 'scholarly_translation', language: 'fr', script: 'Latn', variant: 'academic_french' }
    ],
    sources: [
      { id: 'unesco-african-indigenous-heritage', name: 'UNESCO African Indigenous Intangible Cultural Heritage Archive', authorityLevel: 'institutional', url: 'https://ich.unesco.org' },
      { id: 'ifan-dakar-anthropology', name: 'Institut Fondamental d’Afrique Noire (IFAN Cheikh Anta Diop)', authorityLevel: 'academic', url: 'https://ifan.ucad.sn' }
    ],
    endpoints: [
      { id: 'ep:odinani-omenala-ig', workId: 'odinani-omenala-corpus', sourceId: 'unesco-african-indigenous-heritage', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/odinani/omenala.json', format: 'json' },
      { id: 'ep:odinani-ofo-ig', workId: 'odinani-ofo-chants', sourceId: 'unesco-african-indigenous-heritage', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/odinani/ofo-chants.json', format: 'json' },
      { id: 'ep:serer-roog-srr', workId: 'serer-roog-cossan', sourceId: 'ifan-dakar-anthropology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/serer/roog-cossan.json', format: 'json' },
      { id: 'ep:serer-saltigue-srr', workId: 'serer-saltigue-divinations', sourceId: 'ifan-dakar-anthropology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/serer/saltigue.json', format: 'json' }
    ]
  },
  'worker-d': {
    workerId: 'worker-d',
    region: 'Indigenous Americas',
    traditions: [
      {
        id: 'cherokee-tradition',
        name: 'Cherokee Traditional Religion',
        family: 'indigenous_american',
        primaryLanguage: 'chr',
        scripts: ['Cher', 'Latn'],
        classification: ['native_american_religion', 'indigenous_american']
      },
      {
        id: 'inuit-tradition',
        name: 'Inuit Traditional Religion',
        family: 'indigenous_american',
        primaryLanguage: 'iu',
        scripts: ['Cans', 'Latn'],
        classification: ['indigenous_circumpolar_religion', 'indigenous_american']
      }
    ],
    works: [
      {
        id: 'cherokee-sacred-formulas',
        traditionId: 'cherokee-tradition',
        name: 'Sacred Formulas of the Cherokees (Swimmer Manuscript)',
        workType: 'sacred_literature',
        primaryLanguage: 'chr',
        canonicalStatus: 'sacred_literature'
      },
      {
        id: 'cherokee-cosmology-myths',
        traditionId: 'cherokee-tradition',
        name: 'Cherokee Myths and Sacred Origin Stories',
        workType: 'oral_corpus',
        primaryLanguage: 'chr',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'inuit-unikkaaqtuat-corpus',
        traditionId: 'inuit-tradition',
        name: 'Inuit Unikkaaqtuat (Sacred Stories & Cosmological Chants)',
        workType: 'oral_corpus',
        primaryLanguage: 'iu',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'inuit-angakkuq-chants',
        traditionId: 'inuit-tradition',
        name: 'Angakkuq Healing Invocations & Songs',
        workType: 'ritual_corpus',
        primaryLanguage: 'iu',
        canonicalStatus: 'ritual_corpus'
      }
    ],
    editions: [
      { id: 'cherokee-sacred-formulas-original', workId: 'cherokee-sacred-formulas', editionType: 'critical_edition', language: 'chr', script: 'Cher', variant: 'sequoyah_syllabary' },
      { id: 'cherokee-sacred-formulas-english', workId: 'cherokee-sacred-formulas', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'mooney_smithsonian' },
      { id: 'cherokee-myths-chr-original', workId: 'cherokee-cosmology-myths', editionType: 'recorded_oral_edition', language: 'chr', script: 'Cher', variant: 'sequoyah_syllabary' },
      { id: 'cherokee-myths-english', workId: 'cherokee-cosmology-myths', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'mooney_translation' },
      { id: 'inuit-unikkaaqtuat-iu-original', workId: 'inuit-unikkaaqtuat-corpus', editionType: 'recorded_oral_edition', language: 'iu', script: 'Cans', variant: 'inuktitut_syllabics' },
      { id: 'inuit-unikkaaqtuat-english', workId: 'inuit-unikkaaqtuat-corpus', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'rasmussen_smithsonian' },
      { id: 'inuit-angakkuq-iu-original', workId: 'inuit-angakkuq-chants', editionType: 'recorded_oral_edition', language: 'iu', script: 'Cans', variant: 'inuktitut_syllabics' },
      { id: 'inuit-angakkuq-english', workId: 'inuit-angakkuq-chants', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' }
    ],
    sources: [
      { id: 'smithsonian-bureau-american-ethnology', name: 'Smithsonian Institution Bureau of American Ethnology', authorityLevel: 'institutional', url: 'https://library.si.edu' }
    ],
    endpoints: [
      { id: 'ep:cherokee-formulas-chr', workId: 'cherokee-sacred-formulas', sourceId: 'smithsonian-bureau-american-ethnology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/cherokee/sacred-formulas.json', format: 'json' },
      { id: 'ep:cherokee-myths-chr', workId: 'cherokee-cosmology-myths', sourceId: 'smithsonian-bureau-american-ethnology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/cherokee/myths.json', format: 'json' },
      { id: 'ep:inuit-unikkaaqtuat-iu', workId: 'inuit-unikkaaqtuat-corpus', sourceId: 'smithsonian-bureau-american-ethnology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/inuit/unikkaaqtuat.json', format: 'json' },
      { id: 'ep:inuit-angakkuq-iu', workId: 'inuit-angakkuq-chants', sourceId: 'smithsonian-bureau-american-ethnology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/inuit/angakkuq.json', format: 'json' }
    ]
  },
  'worker-e': {
    workerId: 'worker-e',
    region: 'Pacific / Oceania',
    traditions: [
      {
        id: 'tongan-tradition',
        name: 'Tongan Traditional Religion',
        family: 'austronesian_traditional',
        primaryLanguage: 'to',
        scripts: ['Latn'],
        classification: ['polynesian_traditional', 'austronesian_religion']
      },
      {
        id: 'fijian-tradition',
        name: 'Fijian Traditional Religion',
        family: 'austronesian_traditional',
        primaryLanguage: 'fj',
        scripts: ['Latn'],
        classification: ['melanesian_polynesian_traditional', 'austronesian_religion']
      }
    ],
    works: [
      {
        id: 'tonga-tala-e-fonua',
        traditionId: 'tongan-tradition',
        name: 'Tala-e-Fonua (Sacred History and Origin Chants of Tonga)',
        workType: 'oral_corpus',
        primaryLanguage: 'to',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'tonga-hikuleo-invocations',
        traditionId: 'tongan-tradition',
        name: 'Hikuleʻo and Pulotu Sacred Invocations',
        workType: 'ritual_corpus',
        primaryLanguage: 'to',
        canonicalStatus: 'ritual_corpus'
      },
      {
        id: 'fiji-tukuni-origin-chants',
        traditionId: 'fijian-tradition',
        name: 'Tukuni ni Vanua (Sacred Origin & Ancestral Chants of Fiji)',
        workType: 'oral_corpus',
        primaryLanguage: 'fj',
        canonicalStatus: 'oral_tradition'
      },
      {
        id: 'fiji-degei-invocations',
        traditionId: 'fijian-tradition',
        name: 'Degei Serpent-God Sacred Invocations',
        workType: 'liturgical_corpus',
        primaryLanguage: 'fj',
        canonicalStatus: 'liturgical'
      }
    ],
    editions: [
      { id: 'tonga-tala-fonua-to-original', workId: 'tonga-tala-e-fonua', editionType: 'recorded_oral_edition', language: 'to', script: 'Latn', variant: 'standard_tongan' },
      { id: 'tonga-tala-fonua-english', workId: 'tonga-tala-e-fonua', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'gifford_bishop_museum' },
      { id: 'tonga-hikuleo-to-original', workId: 'tonga-hikuleo-invocations', editionType: 'recorded_oral_edition', language: 'to', script: 'Latn', variant: 'standard_tongan' },
      { id: 'tonga-hikuleo-english', workId: 'tonga-hikuleo-invocations', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' },
      { id: 'fiji-tukuni-fj-original', workId: 'fiji-tukuni-origin-chants', editionType: 'recorded_oral_edition', language: 'fj', script: 'Latn', variant: 'standard_fijian' },
      { id: 'fiji-tukuni-english', workId: 'fiji-tukuni-origin-chants', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'thomson_translation' },
      { id: 'fiji-degei-fj-original', workId: 'fiji-degei-invocations', editionType: 'recorded_oral_edition', language: 'fj', script: 'Latn', variant: 'standard_fijian' },
      { id: 'fiji-degei-english', workId: 'fiji-degei-invocations', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' }
    ],
    sources: [
      { id: 'bishop-museum-honolulu', name: 'Bernice Pauahi Bishop Museum Pacific Ethno-Religious Archives', authorityLevel: 'institutional', url: 'https://www.bishopmuseum.org' }
    ],
    endpoints: [
      { id: 'ep:tonga-tala-to', workId: 'tonga-tala-e-fonua', sourceId: 'bishop-museum-honolulu', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/pacific/tongan-tala.json', format: 'json' },
      { id: 'ep:tonga-hikuleo-to', workId: 'tonga-hikuleo-invocations', sourceId: 'bishop-museum-honolulu', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/pacific/tongan-hikuleo.json', format: 'json' },
      { id: 'ep:fiji-tukuni-fj', workId: 'fiji-tukuni-origin-chants', sourceId: 'bishop-museum-honolulu', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/pacific/fijian-tukuni.json', format: 'json' },
      { id: 'ep:fiji-degei-fj', workId: 'fiji-degei-invocations', sourceId: 'bishop-museum-honolulu', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/pacific/fijian-degei.json', format: 'json' }
    ]
  },
  'worker-f': {
    workerId: 'worker-f',
    region: 'Middle East / Caucasus',
    traditions: [
      {
        id: 'shabak-tradition',
        name: 'Shabak Tradition',
        family: 'indo_iranian',
        primaryLanguage: 'ckb',
        scripts: ['Arab', 'Latn'],
        classification: ['ghulat_heterodox_syncretism', 'mesopotamian_minority_religion']
      }
    ],
    works: [
      {
        id: 'kitab-al-manaqib-shabak',
        traditionId: 'shabak-tradition',
        name: 'Kitab al-Manaqib (The Book of Exemplary Virtues / Buyruk of the Shabak)',
        workType: 'sacred_literature',
        primaryLanguage: 'ckb',
        canonicalStatus: 'sacred_literature'
      },
      {
        id: 'shabak-duas-and-hymns',
        traditionId: 'shabak-tradition',
        name: 'Shabak Sacred Hymns and Supplications',
        workType: 'liturgical_corpus',
        primaryLanguage: 'ckb',
        canonicalStatus: 'liturgical'
      },
      {
        id: 'shabak-maqamat-sacred',
        traditionId: 'shabak-tradition',
        name: 'Shabak Maqamat & Pilgrimage Recitations',
        workType: 'ritual_corpus',
        primaryLanguage: 'ckb',
        canonicalStatus: 'ritual_corpus'
      }
    ],
    editions: [
      { id: 'kitab-manaqib-shabaki-original', workId: 'kitab-al-manaqib-shabak', editionType: 'critical_edition', language: 'ckb', script: 'Arab', variant: 'shabaki_dialect' },
      { id: 'kitab-manaqib-arabic-translation', workId: 'kitab-al-manaqib-shabak', editionType: 'scholarly_translation', language: 'ar', script: 'Arab', variant: 'classical_arabic' },
      { id: 'kitab-manaqib-english-translation', workId: 'kitab-al-manaqib-shabak', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' },
      { id: 'shabak-hymns-ckb-original', workId: 'shabak-duas-and-hymns', editionType: 'critical_edition', language: 'ckb', script: 'Arab', variant: 'shabaki_dialect' },
      { id: 'shabak-hymns-english-translation', workId: 'shabak-duas-and-hymns', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' },
      { id: 'shabak-maqamat-ckb-original', workId: 'shabak-maqamat-sacred', editionType: 'critical_edition', language: 'ckb', script: 'Arab', variant: 'shabaki_dialect' },
      { id: 'shabak-maqamat-english-translation', workId: 'shabak-maqamat-sacred', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' }
    ],
    sources: [
      { id: 'erbil-mesopotamian-heritage-center', name: 'Center for Mesopotamian Minority Religions & Cultural Heritage', authorityLevel: 'academic', url: 'https://archive.org/details/shabak-manuscripts' }
    ],
    endpoints: [
      { id: 'ep:shabak-manaqib-ckb', workId: 'kitab-al-manaqib-shabak', sourceId: 'erbil-mesopotamian-heritage-center', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/shabak/manaqib.json', format: 'json' },
      { id: 'ep:shabak-hymns-ckb', workId: 'shabak-duas-and-hymns', sourceId: 'erbil-mesopotamian-heritage-center', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/shabak/hymns.json', format: 'json' },
      { id: 'ep:shabak-maqamat-ckb', workId: 'shabak-maqamat-sacred', sourceId: 'erbil-mesopotamian-heritage-center', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/shabak/maqamat.json', format: 'json' }
    ]
  },
  'worker-g': {
    workerId: 'worker-g',
    region: 'European / Baltic Historical',
    traditions: [
      {
        id: 'baltic-tradition',
        name: 'Baltic Religion (Romuva & Dievturyba)',
        family: 'indo_european_polytheism',
        primaryLanguage: 'lt',
        scripts: ['Latn'],
        classification: ['historical_tradition', 'baltic_polytheism', 'reconstructed_tradition']
      }
    ],
    works: [
      {
        id: 'lithuanian-dainos-mythological',
        traditionId: 'baltic-tradition',
        name: 'Lithuanian Mythological Dainos (Sacred Folk Songs)',
        workType: 'sacred_poetry',
        primaryLanguage: 'lt',
        canonicalStatus: 'sacred_literature'
      },
      {
        id: 'latvian-dainas-dieva',
        traditionId: 'baltic-tradition',
        name: 'Latvian Dainas (Dieva Dziesmas / Songs of Dievs and Mara)',
        workType: 'sacred_poetry',
        primaryLanguage: 'lv',
        canonicalStatus: 'sacred_literature'
      },
      {
        id: 'baltic-perkunas-chants',
        traditionId: 'baltic-tradition',
        name: 'Perkunas and Saule Invocations & Hymns',
        workType: 'liturgical_corpus',
        primaryLanguage: 'lt',
        canonicalStatus: 'liturgical'
      }
    ],
    editions: [
      { id: 'lithuanian-dainos-lt-original', workId: 'lithuanian-dainos-mythological', editionType: 'critical_edition', language: 'lt', script: 'Latn', variant: 'standard_lithuanian' },
      { id: 'lithuanian-dainos-english-translation', workId: 'lithuanian-dainos-mythological', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'gimbutas_translation' },
      { id: 'latvian-dainas-lv-original', workId: 'latvian-dainas-dieva', editionType: 'critical_edition', language: 'lv', script: 'Latn', variant: 'standard_latvian' },
      { id: 'latvian-dainas-english-translation', workId: 'latvian-dainas-dieva', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'barons_archive_translation' },
      { id: 'baltic-perkunas-lt-original', workId: 'baltic-perkunas-chants', editionType: 'critical_edition', language: 'lt', script: 'Latn', variant: 'standard_lithuanian' },
      { id: 'baltic-perkunas-english-translation', workId: 'baltic-perkunas-chants', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' }
    ],
    sources: [
      { id: 'vilnius-university-baltic-mythology', name: 'Vilnius University Center of Baltic Mythological & Folklore Studies', authorityLevel: 'academic', url: 'https://www.flf.vu.lt' },
      { id: 'latvian-folklore-archives', name: 'Institute of Literature, Folklore and Art of the University of Latvia (Dainu Skapis)', authorityLevel: 'institutional', url: 'http://www.dainuskapis.lv' }
    ],
    endpoints: [
      { id: 'ep:lithuanian-dainos-lt', workId: 'lithuanian-dainos-mythological', sourceId: 'vilnius-university-baltic-mythology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/baltic/lithuanian-dainos.json', format: 'json' },
      { id: 'ep:latvian-dainas-lv', workId: 'latvian-dainas-dieva', sourceId: 'latvian-folklore-archives', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/baltic/latvian-dainas.json', format: 'json' },
      { id: 'ep:baltic-perkunas-lt', workId: 'baltic-perkunas-chants', sourceId: 'vilnius-university-baltic-mythology', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/baltic/perkunas.json', format: 'json' }
    ]
  },
  'worker-h': {
    workerId: 'worker-h',
    region: 'Ancient Levantine / Mediterranean Historical',
    traditions: [
      {
        id: 'canaanite-phoenician',
        name: 'Canaanite-Phoenician Religion',
        family: 'ancient_near_eastern',
        primaryLanguage: 'phn',
        scripts: ['Phnx', 'Latn'],
        classification: ['historical_tradition', 'ancient_near_eastern_polytheism']
      }
    ],
    works: [
      {
        id: 'phoenician-sacred-inscriptions',
        traditionId: 'canaanite-phoenician',
        name: 'Phoenician-Punic Sacred Inscriptions & Ciypi (CIS I)',
        workType: 'historical_religious_corpus',
        primaryLanguage: 'phn',
        canonicalStatus: 'historical'
      },
      {
        id: 'sanchuniathon-theology-fragments',
        traditionId: 'canaanite-phoenician',
        name: 'Sanchuniathon Phoenician Theology & Cosmological Fragments',
        workType: 'historical_religious_corpus',
        primaryLanguage: 'grc',
        canonicalStatus: 'historical'
      },
      {
        id: 'kilamuwa-karatepe-inscriptions',
        traditionId: 'canaanite-phoenician',
        name: 'Karatepe and Kilamuwa Sacred Monumental Inscriptions',
        workType: 'historical_religious_corpus',
        primaryLanguage: 'phn',
        canonicalStatus: 'historical'
      }
    ],
    editions: [
      { id: 'phoenician-inscriptions-phn-original', workId: 'phoenician-sacred-inscriptions', editionType: 'critical_edition', language: 'phn', script: 'Phnx', variant: 'epigraphic_standard' },
      { id: 'phoenician-inscriptions-english', workId: 'phoenician-sacred-inscriptions', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'donner_rollig_english' },
      { id: 'sanchuniathon-grc-original', workId: 'sanchuniathon-theology-fragments', editionType: 'critical_edition', language: 'grc', script: 'Grek', variant: 'philo_byblos_greek' },
      { id: 'sanchuniathon-english', workId: 'sanchuniathon-theology-fragments', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'cory_ancient_fragments' },
      { id: 'karatepe-phn-original', workId: 'kilamuwa-karatepe-inscriptions', editionType: 'critical_edition', language: 'phn', script: 'Phnx', variant: 'bilingual_monumental' },
      { id: 'karatepe-english', workId: 'kilamuwa-karatepe-inscriptions', editionType: 'scholarly_translation', language: 'en', script: 'Latn', variant: 'academic_english' }
    ],
    sources: [
      { id: 'corpus-inscriptionum-semiticarum', name: 'Corpus Inscriptionum Semiticarum (Académie des Inscriptions et Belles-Lettres)', authorityLevel: 'academic', url: 'https://archive.org/details/corpusinscriptio01acaduoft' }
    ],
    endpoints: [
      { id: 'ep:phoenician-inscriptions-phn', workId: 'phoenician-sacred-inscriptions', sourceId: 'corpus-inscriptionum-semiticarum', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/phoenician/inscriptions.json', format: 'json' },
      { id: 'ep:sanchuniathon-grc', workId: 'sanchuniathon-theology-fragments', sourceId: 'corpus-inscriptionum-semiticarum', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/phoenician/sanchuniathon.json', format: 'json' },
      { id: 'ep:karatepe-phn', workId: 'kilamuwa-karatepe-inscriptions', sourceId: 'corpus-inscriptionum-semiticarum', adapter: 'http-json', url: 'https://raw.githubusercontent.com/bjo163/moonwitness-upstream/main/phoenician/karatepe.json', format: 'json' }
    ]
  }
}

async function main() {
  const workersDir = path.join(process.cwd(), 'dist', 'phase17-workers')
  await mkdir(workersDir, { recursive: true })

  for (const [key, proposal] of Object.entries(proposals)) {
    const filePath = path.join(workersDir, `${key}.json`)
    await writeFile(filePath, JSON.stringify(proposal, null, 2) + '\n', 'utf8')
    console.log(`✓ Written proposal ${key} -> ${filePath}`)
  }

  console.log('✨ All Phase 17 discovery worker proposals generated in dist/phase17-workers/')
}

main().catch(console.error)

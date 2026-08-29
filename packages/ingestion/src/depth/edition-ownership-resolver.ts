import { createHash } from 'node:crypto'

export interface ResolvedOwnership {
  workId: string
  traditionId: string
  editionId: string | null
  sourceId: string
  ownershipStatus: 'OWNED' | 'INFERRED_WITH_EVIDENCE' | 'UNRESOLVED'
  mappingEvidence: string
}

export function computeNormalizedTextHash(text: string): string {
  const normalized = (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  return createHash('sha256').update(normalized, 'utf8').digest('hex')
}

export function resolveRecordOwnership(
  params: {
    datasetId: string
    passageId: string
    language: string
    script?: string | null
    artifactRef?: string | null
    manifestTradition?: string | null
  },
  editions: Array<{ id: string; workId: string; language: string; script?: string; variant?: string }>,
  works: Array<{ id: string; traditionId: string; name: string }>,
  sources: Array<{ id: string; name: string }>
): ResolvedOwnership {
  const { datasetId, passageId, language, script, artifactRef, manifestTradition } = params

  // 1. Direct work resolution from passage ID or dataset ID
  let workId = ''
  let traditionId = manifestTradition ?? ''

  if (passageId.startsWith('mw:passage:')) {
    const parts = passageId.split(':')
    if (parts.length >= 4) {
      traditionId = parts[2]
      workId = parts[3]
    }
  }

  // Work name aliases
  if (datasetId.includes('tao-te-ching')) {
    workId = 'dao-de-jing'
    traditionId = 'daoism'
  } else if (datasetId.includes('analects')) {
    workId = 'analects-of-confucius'
    traditionId = 'confucianism'
  } else if (datasetId.includes('bhagavad-gita')) {
    workId = 'bhagavad-gita'
    traditionId = 'hinduism'
  } else if (datasetId.includes('yoga-sutras')) {
    workId = 'yoga-sutras-patanjali'
    traditionId = 'hinduism'
  } else if (datasetId.includes('principal-upanishads')) {
    workId = 'principal-upanishads'
    traditionId = 'hinduism'
  } else if (datasetId.includes('gathas')) {
    workId = 'yasna-gathas'
    traditionId = 'zoroastrianism'
  } else if (datasetId.includes('suttacentral:dn-mn-sujato')) {
    workId = 'digha-nikaya'
    traditionId = 'buddhism'
  } else if (datasetId.includes('suttacentral:sn-an-sujato')) {
    workId = 'samyutta-nikaya'
    traditionId = 'buddhism'
  } else if (datasetId.includes('dhammapada')) {
    workId = 'dhammapada'
    traditionId = 'buddhism'
  } else if (datasetId.includes('quran')) {
    workId = 'quran'
    traditionId = 'islam'
  } else if (datasetId.includes('hadith:bukhari')) {
    workId = 'hadith-bukhari'
    traditionId = 'islam'
  } else if (datasetId.includes('hadith:muslim')) {
    workId = 'hadith-muslim'
    traditionId = 'islam'
  } else if (datasetId.includes('hadith:nawawi-40')) {
    workId = 'hadith-nawawi'
    traditionId = 'islam'
  } else if (datasetId.includes('duas-authentic')) {
    workId = 'duas-hisnul-muslim'
    traditionId = 'islam'
  } else if (datasetId.includes('oshb:wlc')) {
    workId = 'tanakh'
    traditionId = 'judaism'
  } else if (datasetId.includes('sblgnt:v1-2')) {
    workId = 'greek-new-testament'
    traditionId = 'christianity'
  } else if (datasetId.includes('web-classic')) {
    workId = 'web-bible'
    traditionId = 'christianity'
  } else if (datasetId.includes('bible:tsi-2021')) {
    workId = 'greek-new-testament'
    traditionId = 'christianity'
  } else if (datasetId.includes('kojiki')) {
    workId = 'kojiki'
    traditionId = 'shinto'
  } else if (datasetId.includes('japji-sahib')) {
    workId = 'japji-sahib'
    traditionId = 'sikhism'
  } else if (datasetId.includes('tattvartha-sutra')) {
    workId = 'tattvartha-sutra'
    traditionId = 'jainism'
  } else if (datasetId.includes('pirkei-avot')) {
    workId = 'pirkei-avot'
    traditionId = 'judaism'
  } else if (datasetId.includes('hidden-words')) {
    workId = 'hidden-words'
    traditionId = 'bahai'
  }

  // Find source
  let sourceId = 'universal-corpus-source'
  if (datasetId.includes('quran:tanzil')) sourceId = 'tanzil-project'
  else if (datasetId.includes('quranenc')) sourceId = 'quranenc'
  else if (datasetId.includes('oshb')) sourceId = 'openscriptures-hebrew'
  else if (datasetId.includes('sblgnt')) sourceId = 'sblgnt-society'
  else if (datasetId.includes('suttacentral')) sourceId = 'suttacentral'
  else if (datasetId.includes('hadith') || datasetId.includes('duas')) sourceId = 'ummah-api'
  else if (datasetId.includes('gretil') || datasetId.includes('hinduism') || datasetId.includes('jainism')) sourceId = 'gretil-goettingen'
  else if (datasetId.includes('ctext') || datasetId.includes('taoism') || datasetId.includes('confucianism')) sourceId = 'ctext-chinese-text-project'
  else if (datasetId.includes('shabados') || datasetId.includes('sikhism')) sourceId = 'shabados-open-gurbani'
  else if (datasetId.includes('sefaria') || datasetId.includes('mishnah')) sourceId = 'sefaria-open-data'

  // Specific canonical edition matches with provenance evidence
  if (datasetId === 'mw:dataset:quran:tanzil-uthmani' && language === 'ar') {
    return { workId: 'quran', traditionId: 'islam', editionId: 'quran-tanzil-uthmani', sourceId: 'tanzil-project', ownershipStatus: 'OWNED', mappingEvidence: 'tanzil_uthmani_official_text' }
  }
  if (datasetId === 'mw:dataset:quranenc:english-rwwad' && language === 'en') {
    return { workId: 'quran', traditionId: 'islam', editionId: 'quran-saheeh-international', sourceId: 'quranenc', ownershipStatus: 'OWNED', mappingEvidence: 'quranenc_english_rwwad_provenance' }
  }
  if (datasetId === 'mw:dataset:quranenc:indonesian-kemenag' && language === 'id') {
    return { workId: 'quran', traditionId: 'islam', editionId: 'quran-indonesian-kemenag', sourceId: 'quranenc', ownershipStatus: 'OWNED', mappingEvidence: 'quranenc_indonesian_kemenag_provenance' }
  }
  if (datasetId === 'mw:dataset:oshb:wlc' && language === 'he') {
    return { workId: 'tanakh', traditionId: 'judaism', editionId: 'tanakh-wlc-hebrew', sourceId: 'openscriptures-hebrew', ownershipStatus: 'OWNED', mappingEvidence: 'oshb_wlc_manuscript_evidence' }
  }
  if (datasetId === 'mw:dataset:sblgnt:v1-2' && language === 'grc') {
    return { workId: 'greek-new-testament', traditionId: 'christianity', editionId: 'sblgnt-greek-edition', sourceId: 'sblgnt-society', ownershipStatus: 'OWNED', mappingEvidence: 'sbl_critical_edition_evidence' }
  }
  if (datasetId === 'mw:dataset:web-classic:2020' && language === 'en') {
    return { workId: 'web-bible', traditionId: 'christianity', editionId: 'web-classic-edition', sourceId: 'world-english-bible-ebible', ownershipStatus: 'OWNED', mappingEvidence: 'ebible_web_classic_provenance' }
  }
  if (datasetId === 'mw:dataset:bible:tsi-2021' && language === 'id') {
    return { workId: 'greek-new-testament', traditionId: 'christianity', editionId: 'gnt-indonesian-tb', sourceId: 'alkitab-sabda-archive', ownershipStatus: 'OWNED', mappingEvidence: 'tsi_indonesian_translation_evidence' }
  }
  if (datasetId.includes('dhammapada:indonesian-wikisource') && language === 'id') {
    return { workId: 'dhammapada', traditionId: 'buddhism', editionId: 'dhammapada-indonesian-ed', sourceId: 'wikisource-indonesia', ownershipStatus: 'OWNED', mappingEvidence: 'wikisource_indonesian_dhammapada' }
  }
  if (datasetId.includes('dhammapada:sujato') && (language === 'en' || language === 'pli')) {
    return { workId: 'dhammapada', traditionId: 'buddhism', editionId: 'dhammapada-sujato-pali-en', sourceId: 'suttacentral', ownershipStatus: 'OWNED', mappingEvidence: 'sujato_pali_english_translation' }
  }
  if (datasetId === 'mw:dataset:hadith:bukhari' || datasetId === 'mw:dataset:hadith:bukhari-core') {
    return { workId: 'hadith-bukhari', traditionId: 'islam', editionId: 'bukhari-ummah-ar-en', sourceId: 'ummah-api', ownershipStatus: 'OWNED', mappingEvidence: 'bukhari_ummah_api_canonical' }
  }
  if (datasetId === 'mw:dataset:hadith:muslim') {
    return { workId: 'hadith-muslim', traditionId: 'islam', editionId: 'muslim-ummah-ar-en', sourceId: 'ummah-api', ownershipStatus: 'OWNED', mappingEvidence: 'muslim_ummah_api_canonical' }
  }
  if (datasetId === 'mw:dataset:hadith:nawawi-40') {
    return { workId: 'hadith-nawawi', traditionId: 'islam', editionId: 'nawawi-ummah-ar-en', sourceId: 'ummah-api', ownershipStatus: 'OWNED', mappingEvidence: 'nawawi_ummah_api_canonical' }
  }
  if (datasetId === 'mw:dataset:islam:duas-authentic') {
    if (language === 'ar' || language === 'ar-Latn') {
      return { workId: 'duas-hisnul-muslim', traditionId: 'islam', editionId: 'duas-hisnul-muslim-canonical', sourceId: 'ummah-api', ownershipStatus: 'OWNED', mappingEvidence: 'hisnul_muslim_arabic_canonical' }
    }
    if (language === 'id') {
      return { workId: 'duas-hisnul-muslim', traditionId: 'islam', editionId: 'duas-hisnul-muslim-indonesian', sourceId: 'ummah-api', ownershipStatus: 'OWNED', mappingEvidence: 'hisnul_muslim_indonesian_translation' }
    }
    return { workId: 'duas-hisnul-muslim', traditionId: 'islam', editionId: 'duas-hisnul-muslim-canonical', sourceId: 'ummah-api', ownershipStatus: 'INFERRED_WITH_EVIDENCE', mappingEvidence: 'hisnul_muslim_english_translation' }
  }
  if (datasetId === 'mw:dataset:suttacentral:dn-mn-sujato') {
    return { workId: 'digha-nikaya', traditionId: 'buddhism', editionId: 'suttacentral-dn-sujato', sourceId: 'suttacentral', ownershipStatus: 'OWNED', mappingEvidence: 'suttacentral_dn_sujato_translation' }
  }
  if (datasetId === 'mw:dataset:suttacentral:sn-an-sujato') {
    return { workId: 'samyutta-nikaya', traditionId: 'buddhism', editionId: 'suttacentral-sn-sujato', sourceId: 'suttacentral', ownershipStatus: 'OWNED', mappingEvidence: 'suttacentral_sn_sujato_translation' }
  }
  if (datasetId.includes('confucianism:analects')) {
    return { workId: 'analects-of-confucius', traditionId: 'confucianism', editionId: 'ctext-analects-classical', sourceId: 'ctext-chinese-text-project', ownershipStatus: 'OWNED', mappingEvidence: 'ctext_analects_classical_chinese' }
  }
  if (datasetId.includes('hinduism:bhagavad-gita')) {
    if (language === 'en') {
      return { workId: 'bhagavad-gita', traditionId: 'hinduism', editionId: 'gita-english-prabhupada', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'gita_english_scholarly_translation' }
    }
    return { workId: 'bhagavad-gita', traditionId: 'hinduism', editionId: 'gita-multilingual-edition', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'gita_sanskrit_original' }
  }
  if (datasetId.includes('hinduism:yoga-sutras')) {
    if (language === 'en') {
      return { workId: 'yoga-sutras-patanjali', traditionId: 'hinduism', editionId: 'yoga-sutras-english-woods', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'woods_yoga_sutras_translation' }
    }
    return { workId: 'yoga-sutras-patanjali', traditionId: 'hinduism', editionId: 'yoga-sutras-gretil-edition', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'gretil_sanskrit_yoga_sutras' }
  }
  if (datasetId.includes('hinduism:principal-upanishads')) {
    if (language === 'sa') return { workId: 'principal-upanishads', traditionId: 'hinduism', editionId: 'gretil-sanskrit-upanishads', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'gretil_upanishads_sanskrit' }
    if (language === 'en') return { workId: 'principal-upanishads', traditionId: 'hinduism', editionId: 'upanishads-english-radhakrishnan', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'radhakrishnan_upanishads_translation' }
    if (language === 'id') return { workId: 'principal-upanishads', traditionId: 'hinduism', editionId: 'upanishads-indonesian-ed', sourceId: 'gretil-goettingen', ownershipStatus: 'OWNED', mappingEvidence: 'indonesian_upanishads_translation' }
  }
  if (datasetId.includes('zoroastrianism:gathas')) {
    if (language === 'ae') return { workId: 'yasna-gathas', traditionId: 'zoroastrianism', editionId: 'yasna-gathas-avesta-ed', sourceId: 'avesta-digital-archive', ownershipStatus: 'OWNED', mappingEvidence: 'avesta_gathas_original' }
    if (language === 'en') return { workId: 'yasna-gathas', traditionId: 'zoroastrianism', editionId: 'gathas-english-mills', sourceId: 'avesta-digital-archive', ownershipStatus: 'OWNED', mappingEvidence: 'mills_gathas_translation' }
    if (language === 'id') return { workId: 'yasna-gathas', traditionId: 'zoroastrianism', editionId: 'gathas-english-mills', sourceId: 'avesta-digital-archive', ownershipStatus: 'INFERRED_WITH_EVIDENCE', mappingEvidence: 'gathas_indonesian_translation' }
  }
  if (datasetId.includes('taoism:tao-te-ching')) {
    if (language === 'lzh') return { workId: 'dao-de-jing', traditionId: 'daoism', editionId: 'ctext-daoism-classical', sourceId: 'ctext-chinese-text-project', ownershipStatus: 'OWNED', mappingEvidence: 'ctext_dao_de_jing_classical' }
    if (language === 'en') return { workId: 'dao-de-jing', traditionId: 'daoism', editionId: 'dao-de-jing-legge-en', sourceId: 'ctext-chinese-text-project', ownershipStatus: 'OWNED', mappingEvidence: 'legge_dao_de_jing_translation' }
  }
  if (datasetId.includes('jainism:tattvartha-sutra')) {
    if (language === 'sa') return { workId: 'tattvartha-sutra', traditionId: 'jainism', editionId: 'jain-heritage-tattvartha-ed', sourceId: 'jain-heritage-centres', ownershipStatus: 'OWNED', mappingEvidence: 'jain_heritage_tattvartha_sanskrit' }
    if (language === 'en') return { workId: 'tattvartha-sutra', traditionId: 'jainism', editionId: 'tattvartha-english-tathia', sourceId: 'jain-heritage-centres', ownershipStatus: 'OWNED', mappingEvidence: 'tathia_tattvartha_translation' }
  }
  if (datasetId.includes('mishnah:pirkei-avot')) {
    if (language === 'he') return { workId: 'pirkei-avot', traditionId: 'judaism', editionId: 'mishnah-sefaria-ed', sourceId: 'sefaria-open-data', ownershipStatus: 'OWNED', mappingEvidence: 'sefaria_mishnah_hebrew' }
    if (language === 'en') return { workId: 'pirkei-avot', traditionId: 'judaism', editionId: 'mishnah-sefaria-en', sourceId: 'sefaria-open-data', ownershipStatus: 'OWNED', mappingEvidence: 'sefaria_mishnah_english' }
  }
  if (datasetId.includes('shinto:kojiki')) {
    if (language === 'ja') return { workId: 'kojiki', traditionId: 'shinto', editionId: 'kojiki-japanese-original', sourceId: 'sacred-texts-archive', ownershipStatus: 'OWNED', mappingEvidence: 'kojiki_japanese_original_text' }
    if (language === 'en') return { workId: 'kojiki', traditionId: 'shinto', editionId: 'shinto-kojiki-archival', sourceId: 'sacred-texts-archive', ownershipStatus: 'OWNED', mappingEvidence: 'chamberlain_kojiki_translation' }
  }
  if (datasetId.includes('sikhism:japji-sahib')) {
    if (language === 'pa') return { workId: 'japji-sahib', traditionId: 'sikhism', editionId: 'shabados-japji-gurmukhi', sourceId: 'shabados-open-gurbani', ownershipStatus: 'OWNED', mappingEvidence: 'shabados_japji_gurmukhi_canonical' }
    if (language === 'en') return { workId: 'japji-sahib', traditionId: 'sikhism', editionId: 'japji-english-translation', sourceId: 'shabados-open-gurbani', ownershipStatus: 'OWNED', mappingEvidence: 'japji_english_translation' }
  }
  if (datasetId.includes('bahai:hidden-words')) {
    if (language === 'ar') return { workId: 'hidden-words', traditionId: 'bahai', editionId: 'bahai-hidden-words-official', sourceId: 'bahai-reference-library', ownershipStatus: 'OWNED', mappingEvidence: 'bahai_hidden_words_arabic' }
    if (language === 'id') return { workId: 'hidden-words', traditionId: 'bahai', editionId: 'hidden-words-indonesian-ed', sourceId: 'bahai-reference-library', ownershipStatus: 'OWNED', mappingEvidence: 'bahai_hidden_words_indonesian' }
  }

  // Generic fallback match
  for (const ed of editions) {
    if (workId && ed.workId === workId && (ed.language === language || language.startsWith(ed.language))) {
      return { workId, traditionId, editionId: ed.id, sourceId, ownershipStatus: 'INFERRED_WITH_EVIDENCE', mappingEvidence: 'work_language_registry_match' }
    }
    if (datasetId.includes(ed.id)) {
      return { workId: ed.workId, traditionId, editionId: ed.id, sourceId, ownershipStatus: 'INFERRED_WITH_EVIDENCE', mappingEvidence: 'dataset_edition_id_match' }
    }
  }

  return {
    workId: workId || 'unknown-work',
    traditionId: traditionId || 'universal',
    editionId: null,
    sourceId,
    ownershipStatus: 'UNRESOLVED',
    mappingEvidence: 'unresolved_schema_limitation'
  }
}

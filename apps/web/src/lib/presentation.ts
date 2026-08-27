import type {
  AssertionObject,
  CanonicalId,
  CorpusRecord,
  Resource
} from '@moonwitness/corpus-core'

export const COMPARISON_BOUNDARY =
  'This view places records side by side for inspection. It does not assert identity, equivalence, shared authority, or factual agreement between them.'

export function encodeId(id: string): string {
  return encodeURIComponent(id)
}

export function canonicalHref(id: CanonicalId): string {
  return `/record/${encodeId(id)}`
}

export function datasetHref(id: CanonicalId): string {
  return `/datasets/${encodeId(id)}`
}

export function hrefForRecord(id: CanonicalId, recordType: CorpusRecord['record_type'], kind?: string): string {
  const encoded = encodeId(id)
  if (recordType === 'entity') return `/entity/${encoded}`
  if (recordType === 'resource') return kind === 'textual.passage' ? `/passage/${encoded}` : `/resource/${encoded}`
  if (recordType === 'assertion') return `/assertion/${encoded}`
  if (recordType === 'evidence') return `/evidence/${encoded}`
  if (recordType === 'provenance') return `/provenance/${encoded}`
  return `/record/${encoded}`
}

export function recordHref(record: CorpusRecord): string {
  return hrefForRecord(record.id, record.record_type, 'kind' in record ? record.kind : undefined)
}

export function preferredLabel(record: CorpusRecord): string | undefined {
  if (!('labels' in record) || !record.labels?.length) return undefined
  return record.labels.find((label) => label.role === 'preferred')?.value ?? record.labels[0]?.value
}

export function displayName(record: CorpusRecord): string {
  return preferredLabel(record) ?? record.id
}

export function assertionObjectText(object: AssertionObject): string {
  if ('entity' in object) return object.entity
  if (object.value === null) return 'null'
  if (typeof object.value === 'string') return object.value
  return JSON.stringify(object.value)
}

export function textualPayload(resource: Resource): Record<string, unknown> | null {
  const textual = resource.extensions?.textual
  return textual && typeof textual === 'object' && !Array.isArray(textual)
    ? textual as Record<string, unknown>
    : null
}

export function isRtlScript(script: unknown): boolean {
  return script === 'Arab' || script === 'Hebr' || script === 'Syrc' || script === 'Thaa'
}

export function clampGraphDepth(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(3, Math.max(1, Math.trunc(parsed)))
}

export interface FriendlyDatasetInfo {
  title: string
  subtitle: string
  tradition: 'Islam' | 'Kekristenan' | 'Yudaisme' | 'Buddhisme' | 'Hinduisme' | 'Lintas Tradisi' | 'Sistem'
  icon: string
  badge: string
  description: string
}

export const DATASET_FRIENDLY_META: Record<string, FriendlyDatasetInfo> = {
  'mw:dataset:quran:tanzil-uthmani': {
    title: "Al-Qur'an Al-Karim (Tanzil Utsmani)",
    subtitle: 'Teks sumber bahasa Arab rasm Utsmani lengkap 114 Surah',
    tradition: 'Islam',
    icon: '🕌',
    badge: 'Kitab Suci',
    description: 'Teks kanon Al-Qur\'an ber-isnad dari proyek Tanzil terverifikasi dengan rasm Utsmani.'
  },
  'mw:dataset:quranenc:indonesian-kemenag': {
    title: "Al-Qur'an Terjemahan Kemenag RI",
    subtitle: 'Terjemahan resmi Kementerian Agama Republik Indonesia',
    tradition: 'Islam',
    icon: '🇮🇩',
    badge: 'Terjemahan',
    description: 'Terjemahan bahasa Indonesia resmi lengkap 30 juz ber-akurasi tinggi.'
  },
  'mw:dataset:quranenc:english-rwwad': {
    title: 'Quran English Translation (Rawai Al-Bayan)',
    subtitle: 'Standard English translation from QuranEnc center',
    tradition: 'Islam',
    icon: '📖',
    badge: 'Terjemahan',
    description: 'Clear and authenticated English translation for international study.'
  },
  'mw:dataset:hadith:nawawi-40': {
    title: "Hadits Arba'in An-Nawawi",
    subtitle: '40 Hadis pokok rukun Islam & akhlak dengan isnad dan terjemahan',
    tradition: 'Islam',
    icon: '📜',
    badge: 'Koleksi Hadis',
    description: 'Kompilasi hadis klasik Imam An-Nawawi memisahkan matn Arab dan rantai sanad transmisi.'
  },
  'mw:dataset:islam:quran-tafsir-sample': {
    title: 'Tafsir Al-Qur\'an Klasik',
    subtitle: 'Ekstrak tafsir eksegesis ayat-ayat pilihan',
    tradition: 'Islam',
    icon: '💡',
    badge: 'Tafsir',
    description: 'Komentar tafsir Al-Fatihah dan Al-Ikhlas terhubung langsung ke target ayat.'
  },
  'mw:dataset:sblgnt:v1-2': {
    title: 'Perjanjian Baru Yunani (SBLGNT)',
    subtitle: 'Teks sumber Yunani Koine Perjanjian Baru edisi SBL',
    tradition: 'Kekristenan',
    icon: '✝️',
    badge: 'Kitab Suci',
    description: 'Teks kritis Perjanjian Baru dalam bahasa Yunani kuno dengan ortografi terstandar.'
  },
  'mw:dataset:bible:tsi-2021': {
    title: 'Alkitab Terjemahan Sederhana Indonesia (TSI)',
    subtitle: 'Perjanjian Baru bahasa Indonesia mudah dipahami',
    tradition: 'Kekristenan',
    icon: '🇮🇩',
    badge: 'Terjemahan',
    description: 'Terjemahan PB bahasa Indonesia berorientasi makna dari Albata.'
  },
  'mw:dataset:web-classic:2020': {
    title: 'World English Bible (WEB Classic)',
    subtitle: 'Public domain modern English translation',
    tradition: 'Kekristenan',
    icon: '📖',
    badge: 'Terjemahan',
    description: 'Complete Old and New Testament in clear modern English.'
  },
  'mw:dataset:christianity:early-writings': {
    title: 'Dokumen Kristen Awal & Kredo Kuno',
    subtitle: 'Didakhe, Pengakuan Iman Rasuli, Pengakuan Iman Nicea',
    tradition: 'Kekristenan',
    icon: '📜',
    badge: 'Kredo & Patristik',
    description: 'Teks bahasa Yunani/Latin beserta terjemahan bahasa Indonesia dan Inggris.'
  },
  'mw:dataset:oshb:wlc': {
    title: 'Tanakh Ibrani (Westminster Leningrad Codex)',
    subtitle: 'Teks sumber Ibrani Kitab Suci Tanakh ber-vokalisasi Masoret',
    tradition: 'Yudaisme',
    icon: '✡️',
    badge: 'Kitab Suci',
    description: 'Teks otoritatif naskah Leningrad tertua yang memuat Taurat, Nabi-nabi, dan Tulisan-tulisan.'
  },
  'mw:dataset:mishnah:pirkei-avot': {
    title: 'Mishnah Pirkei Avot (Etika Para Leluhur)',
    subtitle: 'Traktat etika dan hikmah para rabi dalam bahasa Ibrani',
    tradition: 'Yudaisme',
    icon: '📜',
    badge: 'Mishnah',
    description: 'Petuah etika klasik dengan hierarki sitasi traktat, bab, dan mishnah.'
  },
  'mw:dataset:dhammapada:sujato': {
    title: 'Dhammapada (Bhikkhu Sujato Translation)',
    subtitle: 'Terjemahan lengkap 423 bait syair Dhammapada bahasa Inggris',
    tradition: 'Buddhisme',
    icon: '☸️',
    badge: 'Kitab Suci',
    description: 'Koleksi bait suci Dhammapada ber-lisensi CC0 dari SuttaCentral.'
  },
  'mw:dataset:dhammapada:indonesian-wikisource': {
    title: 'Dhammapada Bahasa Indonesia',
    subtitle: 'Terjemahan bahasa Indonesia syair Dhammapada (Wikisumber)',
    tradition: 'Buddhisme',
    icon: '🇮🇩',
    badge: 'Terjemahan',
    description: 'Bait-bait kebajikan sang Buddha dalam bahasa Indonesia.'
  },
  'mw:dataset:hinduism:bhagavad-gita': {
    title: 'Bhagavad Gita (Sanskerta Dewanagari)',
    subtitle: 'Nyanyian Ilahi Sri Kresna kepada Arjuna',
    tradition: 'Hinduisme',
    icon: '🕉️',
    badge: 'Kitab Suci',
    description: 'Shloka-shloka suci Sanskerta beraksara Dewanagari dengan terjemahan EN dan ID.'
  },
  'mw:dataset:devotional:baseline': {
    title: 'Kompilasi Doa & Mantram Lintas Tradisi',
    subtitle: 'Sayyid al-Istighfar, Bapa Kami, Shema, Metta Chanting, Gayatri',
    tradition: 'Lintas Tradisi',
    icon: '🤲',
    badge: 'Doa & Liturgi',
    description: 'Koleksi doa, puji-pujian, dan lantunan suci dunia ber-tinjauan sensitivitas dan etika.'
  },
  'mw:dataset:lexicon:hebrew-biblical-core': {
    title: 'Leksikon Teologi Ibrani Alkitabiah',
    subtitle: 'YHWH, Elohim, Berit, Torah, Kohen, Navi, Hesed, Shalom',
    tradition: 'Yudaisme',
    icon: '📚',
    badge: 'Leksikon',
    description: 'Kamus konsep Ibrani dengan bukti kemunculan di ayat-ayat WLC.'
  },
  'mw:dataset:lexicon:greek-christian-core': {
    title: 'Leksikon Yunani Perjanjian Baru',
    subtitle: 'Logos, Agape, Ecclesia, Charis, Soteria, Pistis, Theos, Kyrios',
    tradition: 'Kekristenan',
    icon: '📚',
    badge: 'Leksikon',
    description: 'Kamus konsep Yunani kuno dengan bukti kemunculan di ayat-ayat SBLGNT.'
  },
  'mw:dataset:lexicon:sanskrit-hindu-core': {
    title: 'Leksikon Sanskerta Filosofis Hindu',
    subtitle: 'Dharma, Karma, Moksha, Atman, Yoga, Bhakti, Avatara, Om',
    tradition: 'Hinduisme',
    icon: '📚',
    badge: 'Leksikon',
    description: 'Kamus istilah spiritual Sanskerta dengan bukti shloka Bhagavad Gita.'
  },
  'mw:dataset:lexicon:quran-arabic-core': {
    title: 'Leksikon Bahasa Arab Al-Qur\'an',
    subtitle: 'Allah, Rabb, dan terminologi teologis Quran',
    tradition: 'Islam',
    icon: '📚',
    badge: 'Leksikon',
    description: 'Kamus akar kata dan konsep teologis Al-Qur\'an ber-evidensi ayat.'
  },
  'mw:dataset:lexicon:dhammapada-core': {
    title: 'Leksikon Istilah Pali Dhammapada',
    subtitle: 'Mind (Citta/Mano), Suffering (Dukkha), dan konsep kebajikan',
    tradition: 'Buddhisme',
    icon: '📚',
    badge: 'Leksikon',
    description: 'Kamus istilah inti etika dan batin ajaran Buddha.'
  },
  'mw:dataset:world-religions:baseline': {
    title: 'Registri Entitas Tradisi Agama Dunia',
    subtitle: 'Profil tokoh, tradisi, institusi, dan tempat suci',
    tradition: 'Lintas Tradisi',
    icon: '🌐',
    badge: 'Registri Entitas',
    description: 'Registri entitas terstandar P13 dengan penilaian historisitas transparan.'
  },
  'mw:dataset:research-graph:baseline': {
    title: 'Graf Penelitian & Intertekstualitas',
    subtitle: 'Relasi kutipan, tafsir, silsilah figur, dan adaptasi doa',
    tradition: 'Lintas Tradisi',
    icon: '🕸️',
    badge: 'Graf Evidensi',
    description: 'Graf evidensi P17 yang menghubungkan antar dokumen tanpa klaim embedding spekulatif.'
  }
}

export function getDatasetFriendlyMeta(id: string): FriendlyDatasetInfo {
  return DATASET_FRIENDLY_META[id] ?? {
    title: id.replace(/^mw:dataset:/, ''),
    subtitle: 'Dataset pack canonical MoonWitness',
    tradition: 'Lintas Tradisi',
    icon: '📦',
    badge: 'Dataset',
    description: 'Paket korpus kanonikal MoonWitness ber-provenance dan checksum terverifikasi.'
  }
}

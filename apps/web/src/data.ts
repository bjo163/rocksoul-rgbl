export interface Tradition {
  id: string
  name: string
  datasetCount?: number
  totalRecords?: number
  primaryLanguage?: string
  scripts?: string[]
}

export interface Work {
  id: string
  title: string
  tradition: string
  language?: string
  description?: string
  source?: string
}

export interface Passage {
  id: string
  workId: string
  locator: string
  label: string
  language?: string
  source: string
  provenance: string
  note?: string
}

export interface SearchRecord {
  id: string
  title: string
  kind: string
  tradition?: string
  language?: string
  snippet?: string
  source?: string
  raw?: Record<string, unknown>
}

export const fallbackTraditions: Tradition[] = [
  { id: "islam", name: "Islam", primaryLanguage: "ar", scripts: ["Arab"] },
  { id: "christianity", name: "Christianity", primaryLanguage: "grc", scripts: ["Grek", "Latn"] },
  { id: "judaism", name: "Judaism / Hebrew Bible", primaryLanguage: "he", scripts: ["Hebr"] },
  { id: "buddhism", name: "Buddhism", primaryLanguage: "pi", scripts: ["Latn"] },
  { id: "hinduism", name: "Hinduism", primaryLanguage: "sa", scripts: ["Deva"] },
  { id: "daoism", name: "Daoism", primaryLanguage: "zh", scripts: ["Hani"] },
  { id: "confucianism", name: "Confucianism", primaryLanguage: "zh", scripts: ["Hani"] },
  { id: "zoroastrianism", name: "Zoroastrianism", primaryLanguage: "ae", scripts: ["Avst"] },
  { id: "sikhism", name: "Sikhism", primaryLanguage: "pa", scripts: ["Guru"] },
  { id: "jainism", name: "Jainism", primaryLanguage: "sa", scripts: ["Deva"] },
  { id: "bahai", name: "Baháʼí", primaryLanguage: "fa", scripts: ["Arab", "Latn"] },
  { id: "shinto", name: "Shinto", primaryLanguage: "ja", scripts: ["Jpan"] },
]

export const fallbackWorks: Work[] = [
  {
    id: "mw:work:quran",
    title: "Qur'an",
    tradition: "islam",
    language: "ar",
    description: "Canonical work identity with source-preserving Arabic and licensed translation lanes.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:sblgnt",
    title: "SBL Greek New Testament",
    tradition: "christianity",
    language: "grc",
    description: "Pinned Greek New Testament expression used for exact passage identity and alignment.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:web-classic",
    title: "World English Bible",
    tradition: "christianity",
    language: "en",
    description: "English Bible expression used in the Jerusalem 70 CE four-way proof case.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:wlc",
    title: "Westminster Leningrad Codex",
    tradition: "judaism",
    language: "he",
    description: "Hebrew Bible source representation with source-sensitive normalization constraints.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:bhagavad-gita",
    title: "Bhagavad Gita",
    tradition: "hinduism",
    language: "sa",
    description: "Sacred-text work available through the RGBL corpus and CLI reading surface.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:kojiki",
    title: "Kojiki",
    tradition: "shinto",
    language: "ja",
    description: "Classical Japanese sacred-literature work represented as source-addressable corpus data.",
    source: "RGBL canonical corpus",
  },
]

export const fallbackPassages: Passage[] = [
  {
    id: "mw:passage:sblgnt:v1-2:mark:13:2",
    workId: "mw:work:sblgnt",
    locator: "Mark 13:2",
    label: "Mark 13:2 · SBLGNT",
    language: "grc",
    source: "SBL Greek New Testament",
    provenance: "Pinned RGBL passage identity; reused by the Jerusalem 70 CE proof case.",
    note: "Exact textual content is served by the RGBL API/corpus release rather than duplicated in the UI fallback.",
  },
  {
    id: "mw:passage:web-classic:2020:mar:13:2",
    workId: "mw:work:web-classic",
    locator: "Mark 13:2",
    label: "Mark 13:2 · WEB Classic 2020",
    language: "en",
    source: "World English Bible",
    provenance: "Canonical RGBL passage identity reused directly across the Rocksoul research graph.",
    note: "Translation identity remains distinct from the source expression.",
  },
]

export const fallbackSearchRecords: SearchRecord[] = [
  ...fallbackWorks.map((work) => ({
    id: work.id,
    title: work.title,
    kind: "work",
    tradition: work.tradition,
    language: work.language,
    snippet: work.description,
    source: work.source,
  })),
  ...fallbackPassages.map((passage) => ({
    id: passage.id,
    title: passage.label,
    kind: "passage",
    language: passage.language,
    snippet: passage.note,
    source: passage.source,
  })),
]

export const evidenceRows = [
  {
    id: "presence",
    label: "Textual attestation exists",
    context: "Presence is a corpus fact, not universal authority.",
    epistemic: "supported_as_textual_attestation",
    sourceCount: 3,
    values: { support: 3, context: 1 },
  },
  {
    id: "translation",
    label: "Translation equals source identity",
    context: "RGBL explicitly keeps expression and translation identity separate.",
    epistemic: "not_asserted",
    sourceCount: 2,
    values: { counter: 2, context: 2 },
  },
  {
    id: "authority",
    label: "Corpus inclusion implies universal authority",
    context: "Authority claims are scoped to sources, communities, or downstream policy.",
    epistemic: "rejected_as_global_inference",
    sourceCount: 4,
    values: { counter: 4, alternative: 1 },
  },
  {
    id: "provenance",
    label: "Provenance is required",
    context: "Pinned source, recipe, checksum and acquisition activity remain inspectable.",
    epistemic: "required_contract",
    sourceCount: 4,
    values: { support: 4, context: 1 },
  },
]

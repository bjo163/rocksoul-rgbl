export interface Tradition {
  id: string
  name: string
  datasetCount?: number
  totalRecords?: number
  primaryLanguage?: string
  scripts?: string[]
}

export interface DatasetInfo {
  id: string
  version?: string
  specVersion?: string
  tradition?: string
  genre?: string
  sourceLanguage?: string
  rights?: string
  availability?: string
  recordCount?: number
}

export interface Work {
  id: string
  title: string
  tradition: string
  language?: string
  description?: string
  source?: string
  datasetId?: string
  rights?: string
  availability?: string
  featuredExpression?: string
  featuredEdition?: string
}

export interface ContentLane {
  id: string
  language: string
  script?: string
  representation: string
  text: string
  artifact?: string
  provenance?: string
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
  contents?: ContentLane[]
}

export interface SearchRecord {
  id: string
  title: string
  kind: string
  recordType?: string
  tradition?: string
  language?: string
  snippet?: string
  source?: string
  datasetId?: string
  score?: number
}

export interface CorpusResource {
  id: string
  record_type?: string
  kind?: string
  labels?: Array<{ value?: string; language?: string; role?: string; script?: string }>
  description?: string
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface ProvenanceRecord {
  id: string
  record_type?: string
  source?: string
  source_reference?: string
  activities?: Array<Record<string, unknown>>
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface EvidenceRecord {
  id: string
  record_type?: string
  target?: string
  relation?: string
  selector?: Record<string, unknown>
  provenance?: string
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface WorkHierarchy {
  work: CorpusResource | null
  expressions: CorpusResource[]
  editions: CorpusResource[]
  artifacts: CorpusResource[]
  dataset: DatasetInfo | null
}

export interface PassageTrace {
  passage: Passage
  rawPassage?: CorpusResource
  contents: ContentLane[]
  artifacts: CorpusResource[]
  provenanceRecords: ProvenanceRecord[]
  evidence: EvidenceRecord[]
  relations: CorpusResource[]
  dataset: DatasetInfo | null
}

export interface AssertionTraversal {
  assertion: Record<string, unknown>
  evidence: EvidenceRecord[]
  targets: Array<Record<string, unknown>>
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
    description: "Canonical Qur'an work identity with source-preserving Arabic and separately attributed translation lanes.",
    source: "RGBL canonical corpus",
    featuredExpression: "mw:expression:quran:ar-uthmani-tanzil-1.1",
    featuredEdition: "mw:edition:quran:tanzil-1.1-uthmani",
  },
  {
    id: "mw:work:new-testament",
    title: "New Testament",
    tradition: "christianity",
    language: "grc",
    description: "Canonical New Testament work. SBLGNT v1.2 is an expression/edition, not a separate work identity.",
    source: "SBLGNT v1.2 lane",
    featuredExpression: "mw:expression:new-testament:grc-sblgnt",
    featuredEdition: "mw:edition:new-testament:sblgnt-v1-2",
  },
  {
    id: "mw:work:bible:web-classic",
    title: "Bible · WEB Classic",
    tradition: "christianity",
    language: "en",
    description: "Canonical WEB Classic work with the 2020 English expression kept distinct from source-language editions.",
    source: "eBible.org · World English Bible Classic 2020",
    featuredExpression: "mw:expression:bible:en-web-classic-2020",
    featuredEdition: "mw:edition:bible:web-classic-2020",
  },
  {
    id: "mw:work:hebrew-bible",
    title: "Hebrew Bible",
    tradition: "judaism",
    language: "he",
    description: "Canonical Hebrew Bible work. Westminster Leningrad Codex is represented as the pinned WLC edition.",
    source: "Open Scriptures Hebrew Bible / WLC",
    featuredExpression: "mw:expression:hebrew-bible:he",
    featuredEdition: "mw:edition:hebrew-bible:wlc",
  },
  {
    id: "mw:work:hinduism:bhagavad-gita",
    title: "Bhagavad Gita",
    tradition: "hinduism",
    language: "sa",
    description: "Canonical Bhagavad Gita work with Sanskrit and available translation content lanes.",
    source: "RGBL canonical corpus",
  },
  {
    id: "mw:work:shinto:kojiki",
    title: "Kojiki",
    tradition: "shinto",
    language: "ja",
    description: "Canonical Shinto Kojiki work represented as source-addressable corpus data.",
    source: "RGBL canonical corpus",
    featuredEdition: "mw:edition:shinto:kojiki:classical",
  },
]

export const fallbackPassages: Passage[] = [
  {
    id: "mw:passage:sblgnt:v1-2:mark:13:2",
    workId: "mw:work:new-testament",
    locator: "Mark 13:2",
    label: "Mark 13:2 · SBLGNT v1.2",
    language: "grc",
    source: "SBL Greek New Testament v1.2",
    provenance: "Pinned RGBL passage identity; exact text is intentionally not duplicated in fallback mode.",
    note: "Connect the live RGBL API to retrieve the canonical Greek content lane and provenance record.",
  },
  {
    id: "mw:passage:web-classic:2020:mar:13:2",
    workId: "mw:work:bible:web-classic",
    locator: "Mark 13:2",
    label: "Mark 13:2 · WEB Classic 2020",
    language: "en",
    source: "World English Bible Classic 2020",
    provenance: "Canonical RGBL passage identity with translation identity kept distinct from other expressions.",
    note: "Connect the live RGBL API to retrieve exact text and source metadata.",
  },
]

export const fallbackSearchRecords: SearchRecord[] = [
  ...fallbackWorks.map((work) => ({
    id: work.id,
    title: work.title,
    kind: "textual.work",
    recordType: "resource",
    tradition: work.tradition,
    language: work.language,
    snippet: work.description,
    source: work.source,
  })),
  ...fallbackPassages.map((passage) => ({
    id: passage.id,
    title: passage.label,
    kind: "textual.passage",
    recordType: "resource",
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
    sourceCount: 1,
    values: { support: 1, context: 1 },
  },
  {
    id: "translation",
    label: "Translation equals source identity",
    context: "RGBL explicitly keeps expression and translation identity separate.",
    epistemic: "not_asserted",
    sourceCount: 1,
    values: { counter: 1, context: 1 },
  },
  {
    id: "authority",
    label: "Corpus inclusion implies universal authority",
    context: "Authority claims remain source/community scoped and downstream.",
    epistemic: "rejected_as_global_inference",
    sourceCount: 1,
    values: { counter: 1, alternative: 1 },
  },
  {
    id: "provenance",
    label: "Provenance is required",
    context: "Pinned source, revision, checksum, rights and acquisition activity remain inspectable.",
    epistemic: "required_contract",
    sourceCount: 1,
    values: { support: 1, context: 1 },
  },
]

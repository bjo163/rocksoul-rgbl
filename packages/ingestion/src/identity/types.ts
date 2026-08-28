export interface CanonicalPosition {
  workId: string
  book?: string | number
  chapter?: number
  section?: number
  verse?: number
  ayah?: number
  surah?: number
  hadith?: number
  sutta?: string | number
  vagga?: number
  mandala?: number
  sukta?: number
  rik?: number
  pada?: number
  sutra?: number
  parashah?: string | number
  tractate?: string
  mishnah?: number
  halakhah?: number
  daf?: string
  ang?: number
  shabad?: number
  pauri?: number
  khanda?: number
  segment?: number
  line?: number
  page?: number
  folio?: string
  hymn?: number
  part?: number
  paragraph?: number
  custom?: Record<string, string | number>
}

export interface UniversalCorpusRecord {
  id: string
  traditionId: string
  workId: string
  editionId?: string
  language: string
  script?: string
  position: CanonicalPosition
  text: string
  source?: {
    sourceId: string
    endpointId: string
    recipeId?: string
    adapterId?: string
  }
  provenance?: {
    requestedUrl?: string
    resolvedUrl?: string
    retrievedAt?: string
    sourceSha256?: string
    sourceCommit?: string
  }
}

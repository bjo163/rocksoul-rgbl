import type { CanonicalPosition } from '../identity/types.js'

export type AlignmentStatus =
  | 'ALIGNED'
  | 'PARTIALLY_ALIGNED'
  | 'STRUCTURALLY_ALIGNED'
  | 'UNALIGNED'
  | 'UNKNOWN'

export interface EditionAlignmentEntry {
  editionId: string
  language: string
  script?: string
  alignment: AlignmentStatus
  recordId?: string
}

export interface PositionAlignmentRecord {
  workId: string
  position: CanonicalPosition | string
  canonicalId: string
  editions: EditionAlignmentEntry[]
}

export interface MultilingualAlignmentReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalWorksAligned: number
  totalPositionsAligned: number
  statusBreakdown: Record<AlignmentStatus, number>
  alignments: PositionAlignmentRecord[]
}

export interface EditionAuditRecord {
  workId: string
  workName: string
  traditionId: string
  editionCount: number
  languages: string[]
  scripts: string[]
  sourceCount: number
  endpointCount: number
  originalLanguagePresent: boolean
  translationCount: number
}

export interface EditionAuditReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalWorks: number
  totalEditions: number
  totalLanguages: number
  worksWithMultipleEditions: number
  worksWithMultipleLanguages: number
  works: EditionAuditRecord[]
}

export interface LanguageCoverageRecord {
  language: string
  isoCode: string
  script: string
  workCount: number
  editionCount: number
  originalEditions: number
  translationEditions: number
}

export interface LanguageCoverageReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalLanguages: number
  languages: LanguageCoverageRecord[]
}

export interface EditionCoverageReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  works: number
  editions: number
  languages: number
  originalLanguageCoverage: string
  translationCoverage: string
  worksWithMultipleEditions: number
  worksWithMultipleLanguages: number
}

import type { CanonicalId } from '@moonwitness/corpus-core'

export interface TraditionRecord {
  id: string
  name: string
  family: 'abrahamic' | 'dharmic' | 'east_asian' | 'indo_iranian' | string
  primaryLanguage: string
  scripts: string[]
  classification?: string[]
}

export interface WorkRecord {
  id: string
  traditionId: string
  name: string
  workType: 'scripture' | 'hadith_corpus' | 'hadith_collection' | 'oral_torah' | 'rabbinic_commentary' | 'patristic_corpus' | 'scripture_translation' | 'devotional' | 'theological_enumeration' | 'sacred_chronicle' | string
  canonicalStatus: 'primary_scripture' | 'canonical_hadith' | 'primary_rabbinic' | 'canonical_rabbinic' | 'canonical_patristics' | 'shruti' | 'smriti_primary' | 'tipitaka_sutta' | 'tipitaka_khuddaka' | 'four_books_primary' | 'primary_treatise' | 'canonical_treatise' | 'canonical_theology' | 'canonical_devotional' | 'canonical_chronicle' | 'scripture_translation' | string
  structure: {
    levels: string[]
  }
}

export interface EditionRecord {
  id: string
  workId: string
  name: string
  editionType: 'original_script' | 'translation' | 'bilingual' | 'multilingual' | 'critical_edition' | 'canonical_library' | 'theological_enumeration' | 'official_publication' | 'archival_translation' | string
  language: string
  script: string
  variant?: string
  translationOf?: string
}

export interface SourceRecord {
  id: string
  name: string
  sourceType: 'community_project' | 'translation_portal' | 'api_platform' | 'digital_library' | 'academic_repository' | 'academic_archive' | 'open_data_repository' | 'academic_library' | 'archival_repository' | 'official_digital_library' | string
  authorityLevel: 'official' | 'institutional' | 'academic' | 'community' | 'archival' | string
  officiality: 'official' | 'official_project' | 'open_data' | 'academic' | 'institutional' | 'archival' | 'non_official' | string
  homepage?: string
}

export interface EndpointRecord {
  id: string
  sourceId: string
  workId: string
  editionId?: string
  name: string
  type: 'rest_api' | 'git_repository' | 'git_repo' | 'open_data_archive' | 'sparql_endpoint' | 'raw_archive' | 'file_download' | string
  baseUrl?: string
  repoUrl?: string
  url?: string
  license: string
  authType?: string
  authHeader?: string
  authEnv?: string
  requiresAuth?: boolean
  allowRemote?: boolean
  allowCache?: boolean
  allowFallback?: boolean
  required?: boolean
}

export interface UniversalExecutionPlan {
  id: string
  traditionId: string
  workId: string
  editionId?: string
  sourceId: string
  endpointId: string
  recipeId?: string
  adapterId?: string
  mode: 'recipe' | 'adapter' | 'legacy' | 'script'
  enabled: boolean
  required: boolean
  allowRemote: boolean
  allowCache: boolean
  allowFallback: boolean
  endpoint: EndpointRecord
}

export interface WorkCoverageReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  traditions: number
  works: number
  editions: number
  sources: number
  endpoints: number
  worksWithUpstream: number
  worksWithoutUpstream: number
  coveragePercent: number
  traditionBreakdown: Array<{
    traditionId: string
    traditionName: string
    workCount: number
    worksWithUpstream: number
    coveragePercent: number
  }>
}

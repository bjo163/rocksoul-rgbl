import type { KnowledgeTemporalValue } from './types.js'

export function validateTemporalInterval(start: number | undefined, end: number | undefined): boolean {
  return start === undefined || end === undefined || start <= end
}

export function validateEraContainment(eventStart: number | undefined, eventEnd: number | undefined, eraStart: number | undefined, eraEnd: number | undefined): boolean {
  return validateTemporalInterval(eventStart, eventEnd) && validateTemporalInterval(eraStart, eraEnd) && (eventStart === undefined || eraStart === undefined || eventStart >= eraStart) && (eventEnd === undefined || eraEnd === undefined || eventEnd <= eraEnd)
}

export function temporalStatus(value: KnowledgeTemporalValue): 'validated' | 'uncertain' | 'disputed' {
  if (value.status === 'DISPUTED' || value.precision === 'DISPUTED') return 'disputed'
  if (value.certainty === 'LOW' || value.precision === 'APPROXIMATE' || value.precision === 'UNKNOWN') return 'uncertain'
  return 'validated'
}

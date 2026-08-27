export interface DiversityCandidate {
  id: string
  tradition: string
  genre: string
  sourceLanguage: string
  community?: string
  dedupeKey: string
}

export interface DiversitySelectionResult {
  selected: DiversityCandidate[]
  duplicates: Array<{ kept: string; duplicate: string; dedupeKey: string }>
}

type Dimension = 'tradition' | 'genre' | 'sourceLanguage' | 'community'
const dimensions: Dimension[] = ['tradition', 'genre', 'sourceLanguage', 'community']

function normalized(value: string | undefined): string {
  return (value ?? 'unspecified').trim().toLowerCase()
}

function dimensionValue(candidate: DiversityCandidate, dimension: Dimension): string {
  return normalized(candidate[dimension])
}

export function deduplicateDiversityCandidates(candidates: DiversityCandidate[]): DiversitySelectionResult {
  const seen = new Map<string, DiversityCandidate>()
  const duplicates: DiversitySelectionResult['duplicates'] = []
  for (const candidate of [...candidates].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = normalized(candidate.dedupeKey)
    if (!key || key === 'unspecified') throw new TypeError(`Candidate ${candidate.id} requires a stable dedupeKey`)
    const existing = seen.get(key)
    if (existing) duplicates.push({ kept: existing.id, duplicate: candidate.id, dedupeKey: candidate.dedupeKey })
    else seen.set(key, candidate)
  }
  return { selected: [...seen.values()], duplicates }
}

export function selectDiverseCandidates(candidates: DiversityCandidate[], limit: number): DiversitySelectionResult {
  if (!Number.isInteger(limit) || limit < 0) throw new TypeError('Diversity selection limit must be a non-negative integer')
  const deduped = deduplicateDiversityCandidates(candidates)
  if (limit === 0 || deduped.selected.length === 0) return { selected: [], duplicates: deduped.duplicates }

  const frequency = new Map<string, number>()
  for (const candidate of deduped.selected) {
    for (const dimension of dimensions) {
      const key = `${dimension}:${dimensionValue(candidate, dimension)}`
      frequency.set(key, (frequency.get(key) ?? 0) + 1)
    }
  }

  const seen = new Map<Dimension, Set<string>>(dimensions.map((dimension) => [dimension, new Set<string>()]))
  const remaining = [...deduped.selected]
  const selected: DiversityCandidate[] = []

  while (remaining.length > 0 && selected.length < limit) {
    remaining.sort((left, right) => {
      const score = (candidate: DiversityCandidate): number => dimensions.reduce((total, dimension) => {
        const value = dimensionValue(candidate, dimension)
        const unseenBonus = seen.get(dimension)!.has(value) ? 0 : 1000
        const rarityBonus = 100 / (frequency.get(`${dimension}:${value}`) ?? 1)
        return total + unseenBonus + rarityBonus
      }, 0)
      const scoreDelta = score(right) - score(left)
      return scoreDelta || left.id.localeCompare(right.id)
    })
    const next = remaining.shift()!
    selected.push(next)
    for (const dimension of dimensions) seen.get(dimension)!.add(dimensionValue(next, dimension))
  }

  return { selected, duplicates: deduped.duplicates }
}

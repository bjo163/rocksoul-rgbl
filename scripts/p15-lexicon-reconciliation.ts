import { readFile } from 'node:fs/promises'
import path from 'node:path'

type LexiconForm = { value: string; language?: string; script?: string; role?: string }
type LexiconRecord = {
  id: string
  kind: string
  labels?: Array<{ value: string; language?: string; script?: string }>
  extensions?: { lexicon?: Record<string, unknown> & { forms?: LexiconForm[]; concept?: string; source_form?: string; value?: string; scheme?: string; scheme_version?: string } }
}

export interface P15ReconciliationReport {
  formatVersion: '1'
  datasets: string[]
  automaticMerge: false
  counts: { terms: number; concepts: number; transliterations: number; duplicates: number; spellingVariants: number; homographs: number; possibleConceptMatches: number }
  duplicates: Array<{ formKey: string; termIds: string[]; concept: string }>
  spellingVariants: Array<{ concept: string; language: string; script: string; values: string[] }>
  transliterations: Array<{ id: string; sourceForm: string; value: string; scheme: string; schemeVersion: string }>
  homographs: Array<{ formKey: string; termIds: string[]; concepts: string[] }>
  possibleConceptMatches: Array<{ labelKey: string; conceptIds: string[]; reason: 'shared_access_label' }>
  guardrails: { reportsAreCandidatesOnly: true; noAutomaticMerge: true; crossTraditionEquivalenceRequiresSource: true }
}

const lexiconFiles = [
  'datasets/dhammapada-lexicon/data/core/resources/lexicon.jsonl',
  'datasets/quran-arabic-lexicon/data/core/resources/lexicon.jsonl',
] as const

function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replaceAll(/\s+/gu, ' ')
}

function formKey(form: LexiconForm): string {
  return `${form.language ?? 'und'}|${form.script ?? 'Zyyy'}|${normalize(form.value)}`
}

async function readRecords(root: string): Promise<LexiconRecord[]> {
  const records: LexiconRecord[] = []
  for (const file of lexiconFiles) {
    const text = await readFile(path.join(root, file), 'utf8')
    records.push(...text.trim().split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line) as LexiconRecord))
  }
  return records
}

export async function buildP15ReconciliationReport(root = process.cwd()): Promise<P15ReconciliationReport> {
  const records = await readRecords(root)
  const terms = records.filter((record) => record.kind === 'lexicon.term')
  const concepts = records.filter((record) => record.kind === 'lexicon.concept')
  const transliterationRecords = records.filter((record) => record.kind === 'lexicon.transliteration')

  const occurrences = new Map<string, Array<{ termId: string; concept: string; form: LexiconForm }>>()
  for (const term of terms) {
    const lexicon = term.extensions?.lexicon
    const concept = String(lexicon?.concept ?? '')
    for (const form of lexicon?.forms ?? []) {
      const key = formKey(form)
      const list = occurrences.get(key) ?? []
      list.push({ termId: term.id, concept, form })
      occurrences.set(key, list)
    }
  }

  const duplicates: P15ReconciliationReport['duplicates'] = []
  const homographs: P15ReconciliationReport['homographs'] = []
  for (const [key, values] of [...occurrences.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const termIds = [...new Set(values.map((value) => value.termId))].sort()
    const conceptIds = [...new Set(values.map((value) => value.concept))].filter(Boolean).sort()
    if (termIds.length > 1 && conceptIds.length === 1) duplicates.push({ formKey: key, termIds, concept: conceptIds[0]! })
    if (conceptIds.length > 1) homographs.push({ formKey: key, termIds, concepts: conceptIds })
  }

  const spellingVariants: P15ReconciliationReport['spellingVariants'] = []
  const byConceptLanguageScript = new Map<string, Set<string>>()
  for (const term of terms) {
    const lexicon = term.extensions?.lexicon
    const concept = String(lexicon?.concept ?? '')
    for (const form of lexicon?.forms ?? []) {
      const key = `${concept}|${form.language ?? 'und'}|${form.script ?? 'Zyyy'}`
      const values = byConceptLanguageScript.get(key) ?? new Set<string>()
      values.add(form.value)
      byConceptLanguageScript.set(key, values)
    }
  }
  for (const [key, values] of [...byConceptLanguageScript.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (values.size < 2) continue
    const [concept, language, script] = key.split('|')
    spellingVariants.push({ concept: concept!, language: language!, script: script!, values: [...values].sort() })
  }

  const labelIndex = new Map<string, Set<string>>()
  for (const concept of concepts) {
    for (const label of concept.labels ?? []) {
      const key = `${label.language ?? 'und'}|${normalize(label.value)}`
      const ids = labelIndex.get(key) ?? new Set<string>()
      ids.add(concept.id)
      labelIndex.set(key, ids)
    }
  }
  const possibleConceptMatches: P15ReconciliationReport['possibleConceptMatches'] = []
  for (const [labelKey, ids] of [...labelIndex.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (ids.size > 1) possibleConceptMatches.push({ labelKey, conceptIds: [...ids].sort(), reason: 'shared_access_label' })
  }

  const transliterations = transliterationRecords.map((record) => {
    const lexicon = record.extensions?.lexicon
    return {
      id: record.id,
      sourceForm: String(lexicon?.source_form ?? ''),
      value: String(lexicon?.value ?? ''),
      scheme: String(lexicon?.scheme ?? ''),
      schemeVersion: String(lexicon?.scheme_version ?? ''),
    }
  }).sort((a, b) => a.id.localeCompare(b.id))

  return {
    formatVersion: '1',
    datasets: [...lexiconFiles],
    automaticMerge: false,
    counts: {
      terms: terms.length,
      concepts: concepts.length,
      transliterations: transliterations.length,
      duplicates: duplicates.length,
      spellingVariants: spellingVariants.length,
      homographs: homographs.length,
      possibleConceptMatches: possibleConceptMatches.length,
    },
    duplicates,
    spellingVariants,
    transliterations,
    homographs,
    possibleConceptMatches,
    guardrails: { reportsAreCandidatesOnly: true, noAutomaticMerge: true, crossTraditionEquivalenceRequiresSource: true },
  }
}

import type { RecipeHooks } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

export const hooks: RecipeHooks<string[], string[]> = {
  parse(bytes) {
    return new TextDecoder().decode(bytes).split(/\r?\n/).filter(Boolean)
  },
  normalize(lines) {
    return lines.map((line) => line.trim().toLowerCase()).filter(Boolean)
  },
  map(lines) {
    return lines.map((line) => ({
      id: `mw:resource:example-ingested:${line}`,
      record_type: 'resource',
      kind: 'example.ingested',
      description: `Synthetic ingested line: ${line}`
    })) as CorpusRecord[]
  },
  validate(records) {
    return new Set(records.map((record) => record.id)).size === records.length ? [] : ['mapped record IDs must be unique']
  }
}

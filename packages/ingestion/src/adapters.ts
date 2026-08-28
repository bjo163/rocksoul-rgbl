import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { AcquisitionResult, IngestionRecipe } from './types.js'

export type AdapterKind = 'generic' | 'http_json' | 'raw_text' | 'jsonl' | 'xml' | 'tei' | 'source_specific'

export interface AdapterContext {
  recipe: IngestionRecipe
  acquisition: AcquisitionResult
}

export interface UpstreamAdapter<Parsed = unknown, Normalized = unknown> {
  readonly id: string
  readonly kind: AdapterKind
  parse(bytes: Uint8Array, context: AdapterContext): Promise<Parsed> | Parsed
  normalize(parsed: Parsed, context: AdapterContext): Promise<Normalized> | Normalized
  map(normalized: Normalized, context: AdapterContext): Promise<CorpusRecord[]> | CorpusRecord[]
  validate?(records: CorpusRecord[], context: AdapterContext): Promise<string[]> | string[]
}

export class AdapterRegistry {
  private readonly adapters = new Map<string, UpstreamAdapter>()

  register(adapter: UpstreamAdapter): this {
    if (this.adapters.has(adapter.id)) throw new Error(`Duplicate upstream adapter: ${adapter.id}`)
    this.adapters.set(adapter.id, adapter)
    return this
  }

  resolve(id: string): UpstreamAdapter {
    const adapter = this.adapters.get(id)
    if (!adapter) throw new Error(`Unknown upstream adapter: ${id}`)
    return adapter
  }

  has(id: string): boolean {
    return this.adapters.has(id)
  }

  ids(): string[] {
    return [...this.adapters.keys()].sort()
  }
}

export const defaultAdapterRegistry = new AdapterRegistry()
  .register({
    id: 'raw-text',
    kind: 'raw_text',
    parse: (bytes) => new TextDecoder().decode(bytes),
    normalize: (parsed) => parsed,
    map: () => []
  })
  .register({
    id: 'http-json',
    kind: 'http_json',
    parse: (bytes) => JSON.parse(new TextDecoder().decode(bytes)),
    normalize: (parsed) => parsed,
    map: () => []
  })

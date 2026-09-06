import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import { hooks } from '../ingestion/recipes/ancient-egypt-book-of-dead-budge/recipe.js'

const root = process.cwd()
const recipeDir = path.join(root, 'ingestion/recipes/ancient-egypt-book-of-dead-budge')
const sourceManifestPath = path.join(recipeDir, 'source/source-manifest.json')
const datasetDir = path.join(root, 'datasets/ancient-egypt-book-of-dead-budge')
const url = 'https://www.gutenberg.org/cache/epub/7145/pg7145.txt'

const manifest = JSON.parse(await readFile(sourceManifestPath, 'utf8')) as { acquisition: { validation: string[] } }
const response = await fetch(url, { headers: { Accept: 'text/plain,*/*' } })
if (!response.ok) throw new Error(`Project Gutenberg HTTP ${response.status}: ${response.statusText}`)
const contentType = response.headers.get('content-type') ?? ''
const text = await response.text()
if (/text\/html/i.test(contentType) || /^\s*<!doctype\s+html/i.test(text) || /captcha|cloudflare/i.test(text.slice(0, 10000))) {
  throw new Error('Rejected HTML/CAPTCHA response from Project Gutenberg')
}
const bytes = new TextEncoder().encode(text)
const sha256 = createHash('sha256').update(bytes).digest('hex')
const retrievedAt = new Date().toISOString()

const acquisition = {
  source: { kind: 'http' as const, url, sha256, byte_size: bytes.byteLength, media_type: 'text/plain; charset=utf-8' },
  resolved_location: url,
  retrieved_at: retrievedAt,
  sha256,
  status: 'REMOTE_SYNCED' as const,
  provenance: { status: 'REMOTE_SYNCED' as const, source_url: url, resolved_location: url, retrieved_at: retrievedAt, source_sha256: sha256 }
}
const records = await hooks.parse(bytes, { recipe: {
  id: 'mw:recipe:ancient-egypt:book-of-dead:budge', version: '1.0.0', specVersion: '0.1',
  source: { kind: 'http', url, sha256, byte_size: bytes.byteLength, media_type: contentType || 'text/plain; charset=utf-8' },
  implementation: { module: 'recipe.ts', parserVersion: '1', normalizerVersion: 'identity-1', mapperVersion: '1', validatorVersion: '1' },
  output: { path: '../../../dist/ingestion/ancient-egypt-book-of-dead-budge.jsonl' }
}, acquisition })
const normalized = hooks.normalize(records, { recipe: {
  id: 'mw:recipe:ancient-egypt:book-of-dead:budge', version: '1.0.0', specVersion: '0.1',
  source: acquisition.source,
  implementation: { module: 'recipe.ts', parserVersion: '1', normalizerVersion: 'identity-1', mapperVersion: '1', validatorVersion: '1' },
  output: { path: '../../../dist/ingestion/ancient-egypt-book-of-dead-budge.jsonl' }
}, acquisition })
const mapped = hooks.map(normalized, { recipe: {
  id: 'mw:recipe:ancient-egypt:book-of-dead:budge', version: '1.0.0', specVersion: '0.1',
  source: acquisition.source,
  implementation: { module: 'recipe.ts', parserVersion: '1', normalizerVersion: 'identity-1', mapperVersion: '1', validatorVersion: '1' },
  output: { path: '../../../dist/ingestion/ancient-egypt-book-of-dead-budge.jsonl' }
}, acquisition })
const findings = hooks.validate?.(mapped, { recipe: {
  id: 'mw:recipe:ancient-egypt:book-of-dead:budge', version: '1.0.0', specVersion: '0.1',
  source: acquisition.source,
  implementation: { module: 'recipe.ts', parserVersion: '1', normalizerVersion: 'identity-1', mapperVersion: '1', validatorVersion: '1' },
  output: { path: '../../../dist/ingestion/ancient-egypt-book-of-dead-budge.jsonl' }
}, acquisition }) ?? []
if (findings.length) throw new Error(`Ancient Egyptian materialization validation failed: ${findings.join('; ')}`)

const core = path.join(datasetDir, 'data/core')
await Promise.all(['entities', 'resources', 'provenance'].map((dir) => mkdir(path.join(core, dir), { recursive: true })))
await writeFile(path.join(core, 'resources', 'ancient-egypt-book-of-dead-budge.jsonl'), deterministicJsonl(mapped.filter((record) => record.record_type === 'resource')), 'utf8')
await writeFile(path.join(core, 'provenance', 'ancient-egypt-book-of-dead-budge.jsonl'), deterministicJsonl(mapped.filter((record) => record.record_type === 'provenance')), 'utf8')
await writeFile(path.join(core, 'entities', 'ancient-egypt-book-of-dead-budge.jsonl'), deterministicJsonl(mapped.filter((record) => record.record_type === 'entity')), 'utf8')

manifest.acquisition.validation.push(`retrieved ${retrievedAt}`, `sha256 ${sha256}`)
await writeFile(sourceManifestPath, `${JSON.stringify({
  formatVersion: '1',
  upstream: { provider: 'Project Gutenberg', ebook: '7145', title: 'The Book of the Dead', author: 'E. A. Wallis Budge', language: 'en', sourceUrl: url, landingPage: 'https://www.gutenberg.org/ebooks/7145', rights: 'Project Gutenberg marks this ebook public domain in the USA; verify target-jurisdiction status before redistribution.' },
  acquisition: { method: 'HTTP plain-text acquisition', contentType: contentType || 'text/plain; charset=utf-8', sha256, byteSize: bytes.byteLength, retrievedAt, validation: manifest.acquisition.validation }
}, null, 2)}\n`, 'utf8')

console.log(`Materialized Ancient Egyptian Book of the Dead (Budge): ${mapped.length} records, ${bytes.byteLength} bytes, sha256=${sha256}`)

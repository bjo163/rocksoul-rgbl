import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const datasetDir = path.join(root, 'datasets/ancient-egypt-book-dead-budge')
const url = 'https://www.gutenberg.org/cache/epub/7145/pg7145.txt'

const sha256 = (value: Uint8Array) => createHash('sha256').update(value).digest('hex')

async function main(): Promise<void> {
  const text = await readFile(path.join(datasetDir, 'data/core/resources/ancient-egypt-book-of-dead-budge.jsonl'), 'utf8')
  const bytes = new TextEncoder().encode(text)
  const sourceManifestPath = path.join(root, 'ingestion/recipes/ancient-egypt-book-of-dead-budge/source/source-manifest.json')
  const manifest = JSON.parse(await readFile(sourceManifestPath, 'utf8')) as Record<string, any>
  manifest.upstream = {
    provider: 'Project Gutenberg',
    ebook: '7145',
    title: 'The Book of the Dead',
    author: 'E. A. Wallis Budge',
    language: 'en',
    sourceUrl: url,
    landingPage: 'https://www.gutenberg.org/ebooks/7145',
    rights: 'Project Gutenberg marks this ebook public domain in the USA; verify target-jurisdiction status before redistribution.'
  }
  manifest.acquisition = {
    ...(manifest.acquisition ?? {}),
    method: 'HTTP plain-text acquisition',
    contentType: 'application/jsonl',
    sha256: sha256(bytes),
    byteSize: bytes.byteLength,
    validation: Array.isArray(manifest.acquisition?.validation) ? manifest.acquisition.validation : []
  }
  await writeFile(sourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

await main()

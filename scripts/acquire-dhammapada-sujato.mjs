import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const COMMIT = 'cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6'
const REPOSITORY = 'suttacentral/bilara-data'
const recipeDir = path.resolve('ingestion/recipes/dhammapada-sujato')
const sourceDir = path.join(recipeDir, 'source')

const ranges = [
  [1, 20], [21, 32], [33, 43], [44, 59], [60, 75], [76, 89], [90, 99],
  [100, 115], [116, 128], [129, 145], [146, 156], [157, 166], [167, 178],
  [179, 196], [197, 208], [209, 220], [221, 234], [235, 255], [256, 272],
  [273, 289], [290, 305], [306, 319], [320, 333], [334, 359], [360, 382],
  [383, 423],
]

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest('hex')
}

function gitBlobSha1(bytes) {
  const header = Buffer.from(`blob ${bytes.byteLength}\0`, 'utf8')
  return createHash('sha1').update(header).update(bytes).digest('hex')
}

await mkdir(sourceDir, { recursive: true })
const files = []

for (const [start, end] of ranges) {
  const file = `dhp${start}-${end}_translation-en-sujato.json`
  const upstreamPath = `translation/en/sujato/sutta/kn/dhp/${file}`
  const url = `https://raw.githubusercontent.com/${REPOSITORY}/${COMMIT}/${upstreamPath}`
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`Failed to acquire ${url}: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const parsed = JSON.parse(bytes.toString('utf8'))
  if (!( `dhp${start}:0.3` in parsed)) throw new Error(`Missing chapter marker in ${file}`)
  if (!Object.keys(parsed).some((key) => key.startsWith(`dhp${end}:`))) throw new Error(`Missing final stanza ${end} in ${file}`)
  await writeFile(path.join(sourceDir, file), bytes)
  files.push({
    file,
    upstreamPath,
    start,
    end,
    byteSize: bytes.byteLength,
    sha256: digest('sha256', bytes),
    gitBlobSha1: gitBlobSha1(bytes),
  })
}

const sourceManifest = {
  formatVersion: '1',
  upstream: { repository: REPOSITORY, branch: 'published', commit: COMMIT },
  files,
}
const manifestBytes = Buffer.from(`${JSON.stringify(sourceManifest, null, 2)}\n`, 'utf8')
await writeFile(path.join(sourceDir, 'source-manifest.json'), manifestBytes)

const recipe = {
  id: 'mw:recipe:dhammapada:sujato',
  version: '1.0.0',
  specVersion: '0.1',
  source: {
    kind: 'filesystem',
    path: 'source/source-manifest.json',
    sha256: digest('sha256', manifestBytes),
    byte_size: manifestBytes.byteLength,
    media_type: 'application/json',
  },
  implementation: {
    module: 'recipe.ts',
    parserVersion: '1',
    normalizerVersion: 'identity-1',
    mapperVersion: '1',
    validatorVersion: '1',
  },
  output: { path: '../../../dist/ingestion/dhammapada-sujato.jsonl' },
}
await writeFile(path.join(recipeDir, 'recipe.json'), `${JSON.stringify(recipe, null, 2)}\n`, 'utf8')

console.log(`Acquired ${files.length} pinned Dhammapada source files from ${REPOSITORY}@${COMMIT}`)
console.log(`Source manifest SHA-256: ${recipe.source.sha256}`)

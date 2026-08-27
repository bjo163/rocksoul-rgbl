import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { runIngestion } from '@moonwitness/corpus-ingestion'

const root = process.cwd()
const recipeDir = path.join(root, 'ingestion/recipes/dhammapada-sujato')
const sourceDir = path.join(recipeDir, 'source')
const expectedCommit = 'cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6'
const expectedSourceManifestSha256 = '3b667414243f5c66e0dc244d5b25947f8148fc510b3401e31cfd4f1d5b27fbba'
const expectedRanges = [
  [1, 20], [21, 32], [33, 43], [44, 59], [60, 75], [76, 89], [90, 99],
  [100, 115], [116, 128], [129, 145], [146, 156], [157, 166], [167, 178],
  [179, 196], [197, 208], [209, 220], [221, 234], [235, 255], [256, 272],
  [273, 289], [290, 305], [306, 319], [320, 333], [334, 359], [360, 382],
  [383, 423],
]

interface SourceFile {
  file: string
  upstreamPath: string
  start: number
  end: number
  byteSize: number
  sha256: string
  gitBlobSha1: string
}

interface SourceManifest {
  formatVersion: string
  upstream: { repository: string; branch: string; commit: string }
  files: SourceFile[]
}

interface ResourceLike {
  id: string
  record_type: string
  kind?: string
  extensions?: {
    textual?: {
      unit?: string
      local_id?: string
      text?: string
      representation?: string
      language?: string
      script?: string
    }
    source?: {
      descriptor?: { availability?: string }
      rights?: {
        status?: string
        redistribution?: string
        license_expression?: string
      }
    }
  }
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function gitBlobSha1(bytes: Uint8Array): string {
  const header = Buffer.from(`blob ${bytes.byteLength}\0`, 'utf8')
  return createHash('sha1').update(header).update(bytes).digest('hex')
}

test('P12 complete Sujato Dhammapada stays pinned, complete, source-preserving, and CC0-bundled', async () => {
  const sourceManifestBytes = await readFile(path.join(sourceDir, 'source-manifest.json'))
  assert.equal(sha256(sourceManifestBytes), expectedSourceManifestSha256)

  const manifest = JSON.parse(sourceManifestBytes.toString('utf8')) as SourceManifest
  assert.equal(manifest.formatVersion, '1')
  assert.deepEqual(manifest.upstream, {
    repository: 'suttacentral/bilara-data',
    branch: 'published',
    commit: expectedCommit,
  })
  assert.equal(manifest.files.length, 26)
  assert.deepEqual(manifest.files.map(({ start, end }) => [start, end]), expectedRanges)

  const expectedSegments = new Map<string, string>()
  const stanzaSet = new Set<number>()

  for (const [chapterIndex, sourceFile] of manifest.files.entries()) {
    const bytes = await readFile(path.join(sourceDir, sourceFile.file))
    assert.equal(bytes.byteLength, sourceFile.byteSize, `${sourceFile.file} byte size`)
    assert.equal(sha256(bytes), sourceFile.sha256, `${sourceFile.file} SHA-256`)
    assert.equal(gitBlobSha1(bytes), sourceFile.gitBlobSha1, `${sourceFile.file} Git blob SHA-1`)
    assert.equal(
      sourceFile.upstreamPath,
      `translation/en/sujato/sutta/kn/dhp/${sourceFile.file}`,
      `${sourceFile.file} upstream path`,
    )

    const source = JSON.parse(bytes.toString('utf8')) as Record<string, string>
    for (const [bilaraId, text] of Object.entries(source)) {
      const match = bilaraId.match(/^dhp(\d+):(\d+)$/u)
      if (!match || Number(match[2]) === 0 || text === '') continue
      const stanza = Number(match[1])
      const segment = Number(match[2])
      assert.ok(stanza >= sourceFile.start && stanza <= sourceFile.end, `${bilaraId} must stay inside its chapter range`)
      stanzaSet.add(stanza)
      expectedSegments.set(`mw:content:dhammapada:${chapterIndex + 1}:${stanza}:${segment}:en-sujato`, text)
    }
  }

  assert.equal(stanzaSet.size, 423)
  for (let stanza = 1; stanza <= 423; stanza += 1) assert.ok(stanzaSet.has(stanza), `missing stanza ${stanza}`)
  assert.equal(expectedSegments.size, 1774)

  const result = await runIngestion({ recipeDir, writeOutput: false })
  assert.equal(result.acquisition.sha256, expectedSourceManifestSha256)
  assert.equal(result.records.length, 4005)

  const resources = result.records as ResourceLike[]
  const chapters = resources.filter((record) => record.kind === 'textual.passage' && record.extensions?.textual?.unit === 'chapter')
  const stanzas = resources.filter((record) => record.kind === 'textual.passage' && record.extensions?.textual?.unit === 'stanza')
  const contents = new Map(
    resources
      .filter((record) => record.kind === 'textual.content')
      .map((record) => [record.id, record]),
  )

  assert.equal(chapters.length, 26)
  assert.equal(stanzas.length, 423)
  assert.equal(contents.size, 1774)

  for (const [id, text] of expectedSegments) {
    const content = contents.get(id)
    assert.ok(content, `missing source content ${id}`)
    assert.equal(content.extensions?.textual?.text, text, `${id} must preserve the exact Bilara segment value`)
    assert.equal(content.extensions?.textual?.representation, 'source')
    assert.equal(content.extensions?.textual?.language, 'en')
    assert.equal(content.extensions?.textual?.script, 'Latn')
  }

  const artifact = resources.find((record) => record.id === 'mw:artifact:dhammapada:suttacentral-sujato-complete')
  assert.ok(artifact)
  assert.equal(artifact.extensions?.source?.descriptor?.availability, 'bundled')
  assert.equal(artifact.extensions?.source?.rights?.status, 'public_domain')
  assert.equal(artifact.extensions?.source?.rights?.redistribution, 'permitted')
  assert.equal(artifact.extensions?.source?.rights?.license_expression, 'CC0-1.0')
})

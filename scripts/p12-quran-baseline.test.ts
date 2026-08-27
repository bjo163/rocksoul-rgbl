import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { runIngestion } from '@moonwitness/corpus-ingestion'

const root = process.cwd()
const recipeDir = path.join(root, 'ingestion/recipes/quran-tanzil-uthmani')
const sourcePath = path.join(recipeDir, 'source/quran-uthmani-tanzil-v1.1.txt')
const expectedSha256 = '6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f'
const expectedByteSize = 1_396_087

interface RawVerse {
  surah: number
  ayah: number
  text: string
}

interface ResourceLike {
  id: string
  record_type: string
  kind?: string
  extensions?: {
    textual?: {
      text?: string
      representation?: string
      language?: string
      script?: string
    }
    source?: {
      artifact?: string
      provenance?: string
      descriptor?: {
        availability?: string
        byte_size?: number
        sha256?: string
      }
      rights?: {
        status?: string
        redistribution?: string
        license_expression?: string
        note?: string
      }
    }
  }
}

function parseRawVerses(source: string): RawVerse[] {
  const rows: RawVerse[] = []
  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(/^(\d+)\|(\d+)\|(.*)$/u)
    if (!match) continue
    rows.push({ surah: Number(match[1]), ayah: Number(match[2]), text: match[3] })
  }
  return rows
}

test('P12 Quran Tanzil v1.1 baseline remains pinned, complete, rights-safe, and source-preserving', async () => {
  const bytes = await readFile(sourcePath)
  assert.equal(bytes.byteLength, expectedByteSize)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedSha256)

  const rawVerses = parseRawVerses(bytes.toString('utf8'))
  assert.equal(rawVerses.length, 6236)
  assert.deepEqual([rawVerses[0]?.surah, rawVerses[0]?.ayah], [1, 1])
  assert.deepEqual([rawVerses.at(-1)?.surah, rawVerses.at(-1)?.ayah], [114, 6])

  const result = await runIngestion({ recipeDir, writeOutput: false })
  assert.equal(result.acquisition.sha256, expectedSha256)

  const resources = result.records as ResourceLike[]
  const contents = new Map(
    resources
      .filter((record) => record.record_type === 'resource' && record.kind === 'textual.content')
      .map((record) => [record.id, record]),
  )
  assert.equal(contents.size, 6236)

  for (const verse of rawVerses) {
    const id = `mw:content:quran:${verse.surah}:${verse.ayah}:ar-uthmani`
    const content = contents.get(id)
    assert.ok(content, `missing source content ${id}`)
    assert.equal(content.extensions?.textual?.text, verse.text, `${id} must remain byte-for-byte source text at the string level`)
    assert.equal(content.extensions?.textual?.representation, 'source')
    assert.equal(content.extensions?.textual?.language, 'ar')
    assert.equal(content.extensions?.textual?.script, 'Arab')
    assert.equal(content.extensions?.source?.artifact, 'mw:artifact:quran:tanzil-1.1-uthmani')
    assert.equal(content.extensions?.source?.provenance, 'mw:provenance:quran:tanzil-1.1-uthmani')
  }

  const artifact = resources.find((record) => record.id === 'mw:artifact:quran:tanzil-1.1-uthmani')
  assert.ok(artifact)
  assert.equal(artifact.extensions?.source?.descriptor?.availability, 'bundled')
  assert.equal(artifact.extensions?.source?.descriptor?.byte_size, expectedByteSize)
  assert.equal(artifact.extensions?.source?.descriptor?.sha256, expectedSha256)
  assert.equal(artifact.extensions?.source?.rights?.status, 'licensed')
  assert.equal(artifact.extensions?.source?.rights?.redistribution, 'permitted')
  assert.equal(artifact.extensions?.source?.rights?.license_expression, 'CC-BY-3.0')
  assert.match(artifact.extensions?.source?.rights?.note ?? '', /not be changed/u)

  const rightsNote = await readFile(path.join(root, 'datasets/quran-tanzil-uthmani/LICENSES/TANZIL.md'), 'utf8')
  assert.match(rightsNote, /https:\/\/tanzil\.net\/docs\/Text_License/u)
  assert.match(rightsNote, /must not be changed/u)
})

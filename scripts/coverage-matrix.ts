import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

type Registry = {
  datasets: Array<{
    id: string
    path: string
    status: string
  }>
}

type CoverageEntry = {
  datasetId: string
  path: string
  availability: 'bundled' | 'external' | 'metadata_only' | 'restricted'
  completeness: {
    status: 'complete' | 'partial' | 'metadata_only' | 'external'
    covered: number
    expected: number | null
  }
  sourceArtifact: {
    sha256: string
  }
  rights: {
    status: string
  }
  provenance: {
    manifest: string
    checksums: string
    recipe: string
  }
}

type CoverageMatrix = {
  formatVersion: string
  datasets: CoverageEntry[]
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

export async function assertCoverageMatrix(root = process.cwd()): Promise<void> {
  const registry = await readJson<Registry>(path.join(root, 'datasets/registry.json'))
  const matrix = await readJson<CoverageMatrix>(path.join(root, 'datasets/coverage.json'))

  assert.equal(matrix.formatVersion, '1')

  const active = registry.datasets.filter((dataset) => dataset.status === 'active')
  const activeIds = active.map((dataset) => dataset.id).sort()
  const matrixIds = matrix.datasets.map((dataset) => dataset.datasetId).sort()

  assert.deepEqual(
    matrixIds,
    activeIds,
    'datasets/coverage.json must contain every active real dataset exactly once and no fixture-only entries',
  )

  assert.equal(new Set(matrixIds).size, matrixIds.length, 'coverage matrix dataset IDs must be unique')

  const registryById = new Map(active.map((dataset) => [dataset.id, dataset]))

  for (const entry of matrix.datasets) {
    const registered = registryById.get(entry.datasetId)
    assert.ok(registered, `coverage entry ${entry.datasetId} must exist in the active registry`)
    assert.equal(entry.path, registered.path, `coverage path for ${entry.datasetId} must match datasets/registry.json`)

    assert.ok(Number.isInteger(entry.completeness.covered) && entry.completeness.covered >= 0)

    if (entry.completeness.status === 'complete' || entry.completeness.status === 'partial') {
      assert.ok(Number.isInteger(entry.completeness.expected) && (entry.completeness.expected ?? 0) > 0)
      assert.ok(
        entry.completeness.covered <= (entry.completeness.expected ?? 0),
        `coverage for ${entry.datasetId} cannot exceed its expected unit count`,
      )

      if (entry.completeness.status === 'complete') {
        assert.equal(
          entry.completeness.covered,
          entry.completeness.expected,
          `complete dataset ${entry.datasetId} must cover all expected units`,
        )
      } else {
        assert.ok(
          entry.completeness.covered < (entry.completeness.expected ?? 0),
          `partial dataset ${entry.datasetId} must expose a real completeness gap`,
        )
      }
    } else {
      assert.equal(
        entry.completeness.expected,
        null,
        `${entry.completeness.status} coverage for ${entry.datasetId} must not invent an expected textual unit count`,
      )
    }

    assert.match(entry.sourceArtifact.sha256, /^[0-9a-f]{64}$/)

    if (entry.availability === 'bundled') {
      assert.ok(
        entry.rights.status.startsWith('verified_for_bundled_'),
        `bundled dataset ${entry.datasetId} must expose a verified bundled-rights state`,
      )
    }

    for (const file of [entry.provenance.manifest, entry.provenance.checksums]) {
      await readFile(path.join(root, file), 'utf8')
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await assertCoverageMatrix()
  console.log('coverage matrix OK')
}

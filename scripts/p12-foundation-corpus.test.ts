import assert from 'node:assert/strict'
import test from 'node:test'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { runIngestion } from '@moonwitness/corpus-ingestion'

const root = process.cwd()

const sourceDatasets = [
  { recipe: 'ingestion/recipes/quran-tanzil-uthmani', dataset: 'datasets/quran-tanzil-uthmani', expectedRecords: 12594 },
  { recipe: 'ingestion/recipes/dhammapada-sujato', dataset: 'datasets/dhammapada-sujato', expectedRecords: 4005 },
  { recipe: 'ingestion/recipes/oshb-wlc', dataset: 'datasets/oshb-wlc', expectedRecords: 69648 },
  { recipe: 'ingestion/recipes/sblgnt-v1-2', dataset: 'datasets/sblgnt-v1-2', expectedRecords: 15885 },
  { recipe: 'ingestion/recipes/web-classic-2020', dataset: 'datasets/web-classic-2020', expectedRecords: 76124 },
  { recipe: 'ingestion/recipes/suttacentral-dn-mn', dataset: 'datasets/suttacentral-dn-mn-sujato', expectedRecords: 75089 },
  { recipe: 'ingestion/recipes/suttacentral-sn-an', dataset: 'datasets/suttacentral-sn-an-sujato', expectedRecords: 147914 }
] as const

test('P12 bundled source corpora are checksum-pinned, deterministic, and provenance-complete', async () => {
  for (const item of sourceDatasets) {
    const first = await runIngestion({ recipeDir: path.join(root, item.recipe), writeOutput: false })
    const second = await runIngestion({ recipeDir: path.join(root, item.recipe), writeOutput: false })
    assert.equal(first.records.length, item.expectedRecords, `${item.recipe} record count`)
    assert.equal(first.outputSha256, second.outputSha256, `${item.recipe} output must be deterministic`)
    assert.deepEqual(first.acquisition.sha256, first.recipe.source.sha256, `${item.recipe} acquisition checksum`)

    const manifest = JSON.parse(await readFile(path.join(root, item.dataset, 'manifest.json'), 'utf8')) as { profiles: string[]; rights: string; availability: string }
    assert.ok(manifest.profiles.includes('textual@0.1'), `${item.dataset} declares textual profile`)
    assert.ok(manifest.profiles.includes('source@0.1'), `${item.dataset} declares source profile`)
    assert.equal(manifest.availability, 'bundled', `${item.dataset} is intentionally bundled`)
    assert.ok(manifest.rights.length > 20, `${item.dataset} has a substantive rights statement`)
    await access(path.join(root, item.dataset, 'CHECKSUMS.sha256'))
  }
})

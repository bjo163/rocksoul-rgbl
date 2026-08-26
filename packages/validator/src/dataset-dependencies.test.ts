import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'

const root = process.cwd()
const schemaDir = path.join(root, 'spec/v0.1/schemas/core')
const commonSchema = JSON.parse(
  await readFile(path.join(schemaDir, 'common.schema.json'), 'utf8')
) as object
const datasetSchema = JSON.parse(
  await readFile(path.join(schemaDir, 'dataset.schema.json'), 'utf8')
) as object

function validator() {
  const ajv = new Ajv2020({ strict: false, allErrors: true })
  ajv.addSchema(commonSchema)
  return ajv.compile(datasetSchema)
}

const baseManifest = {
  id: 'mw:dataset:example:a',
  datasetVersion: '0.1.0',
  specVersion: '0.1',
  profiles: [],
  partitions: [{ recordType: 'entity', path: 'data/*.jsonl' }]
}

test('dataset schema accepts exact pinned dependencies', () => {
  const validate = validator()
  assert.equal(
    validate({
      ...baseManifest,
      dependencies: [
        { dataset: 'mw:dataset:example:b', version: '1.2.3' },
        { dataset: 'mw:dataset:example:c', version: '2.0.0-alpha.1' }
      ]
    }),
    true,
    JSON.stringify(validate.errors)
  )
})

test('dataset schema rejects non-canonical dependency IDs and version ranges', () => {
  const validate = validator()
  assert.equal(
    validate({
      ...baseManifest,
      dependencies: [{ dataset: 'example-b', version: '1.2.3' }]
    }),
    false
  )
  assert.equal(
    validate({
      ...baseManifest,
      dependencies: [{ dataset: 'mw:dataset:example:b', version: '^1.2.3' }]
    }),
    false
  )
})

test('dataset manifest id itself is a canonical corpus ID', () => {
  const validate = validator()
  assert.equal(validate({ ...baseManifest, id: 'example-a' }), false)
})

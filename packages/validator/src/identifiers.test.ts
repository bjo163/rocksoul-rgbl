import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'

import { isCanonicalId } from '../../core/src/identifiers.js'

const root = process.cwd()
const schemaDir = path.join(root, 'spec/v0.1/schemas/core')
const commonSchema = JSON.parse(
  await readFile(path.join(schemaDir, 'common.schema.json'), 'utf8')
) as { $id: string; $defs: { canonicalId: object } }
const validIds = JSON.parse(
  await readFile(path.join(root, 'fixtures/identifiers/valid.json'), 'utf8')
) as string[]
const invalidIds = JSON.parse(
  await readFile(path.join(root, 'fixtures/identifiers/invalid.json'), 'utf8')
) as Array<{ value: string; reason: string }>

test('JSON Schema canonicalId definition agrees with runtime validation', () => {
  const ajv = new Ajv2020({ strict: false })
  ajv.addSchema(commonSchema)
  const validate = ajv.compile({ $ref: `${commonSchema.$id}#/$defs/canonicalId` })

  for (const id of validIds) {
    assert.equal(validate(id), true, id)
    assert.equal(isCanonicalId(id), true, id)
  }

  for (const fixture of invalidIds) {
    assert.equal(validate(fixture.value), false, fixture.reason)
    assert.equal(isCanonicalId(fixture.value), false, fixture.reason)
  }
})

test('core record schemas reference the shared canonicalId definition', async () => {
  const recordTypes = ['entity', 'resource', 'assertion', 'evidence', 'provenance', 'assessment']

  for (const recordType of recordTypes) {
    const text = await readFile(path.join(schemaDir, `${recordType}.schema.json`), 'utf8')
    assert.equal(text.includes('"pattern": "^mw:'), false, `${recordType} duplicates canonical regex`)
    assert.equal(
      text.includes('common.schema.json#/$defs/canonicalId'),
      true,
      `${recordType} must reference shared canonicalId`
    )
  }
})

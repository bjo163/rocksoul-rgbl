import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'

import {
  isExternalIdentifier,
  isSourceLocalIdentifier
} from '../../core/src/identity-boundaries.js'

const root = process.cwd()
const commonSchema = JSON.parse(
  await readFile(path.join(root, 'spec/v0.1/schemas/core/common.schema.json'), 'utf8')
) as { $id: string; $defs: { externalIdentifier: object; sourceLocalIdentifier: object } }

const externalExamples = [
  { value: { scheme: 'wikidata', value: 'Q123' }, valid: true },
  { value: { scheme: 'doi', value: '10.1000/example', uri: 'https://doi.org/10.1000/example' }, valid: true },
  { value: { scheme: 'VIAF', value: '123' }, valid: false },
  { value: { scheme: 'viaf', value: '' }, valid: false },
  { value: { scheme: 'viaf', value: '123', uri: '/relative' }, valid: false }
] as const

const sourceLocalExamples = [
  { value: { source: 'mw:resource:example', value: '123' }, valid: true },
  { value: { source: 'mw:resource:example', namespace: 'people', value: '123' }, valid: true },
  { value: { source: 'not-canonical', value: '123' }, valid: false },
  { value: { source: 'mw:resource:example', value: '' }, valid: false }
] as const

test('external identifier JSON Schema agrees with runtime validation', () => {
  const ajv = new Ajv2020({ strict: false })
  ajv.addSchema(commonSchema)
  const validate = ajv.compile({ $ref: `${commonSchema.$id}#/$defs/externalIdentifier` })

  for (const example of externalExamples) {
    assert.equal(validate(example.value), example.valid)
    assert.equal(isExternalIdentifier(example.value), example.valid)
  }
})

test('source-local identifier JSON Schema agrees with runtime validation', () => {
  const ajv = new Ajv2020({ strict: false })
  ajv.addSchema(commonSchema)
  const validate = ajv.compile({ $ref: `${commonSchema.$id}#/$defs/sourceLocalIdentifier` })

  for (const example of sourceLocalExamples) {
    assert.equal(validate(example.value), example.valid)
    assert.equal(isSourceLocalIdentifier(example.value), example.valid)
  }
})

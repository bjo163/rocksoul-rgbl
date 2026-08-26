import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertDatasetDependency,
  assertDatasetDependencyList,
  assertExactDatasetVersion,
  datasetDependencyKey,
  isDatasetDependency
} from './dataset-dependencies.js'

test('dataset dependencies use canonical dataset IDs and exact versions', () => {
  const dependency = { dataset: 'mw:dataset:text-a', version: '1.2.3' } as const
  assert.doesNotThrow(() => assertDatasetDependency(dependency))
  assert.equal(isDatasetDependency(dependency), true)
  assert.equal(datasetDependencyKey(dependency), 'mw:dataset:text-a@1.2.3')
})

test('version ranges, wildcards, partial versions, and leading-zero core versions are rejected', () => {
  for (const version of ['^1.2.3', '~1.2.3', '1.x', '1.2', '*', '01.2.3', '1.02.3', '1.2.03']) {
    assert.throws(() => assertExactDatasetVersion(version), TypeError, version)
  }

  for (const version of ['0.1.0', '1.2.3', '1.2.3-alpha.1', '1.2.3+build.5']) {
    assert.doesNotThrow(() => assertExactDatasetVersion(version), version)
  }
})

test('dependency lists reject self-dependencies and duplicate dataset identities', () => {
  assert.throws(
    () =>
      assertDatasetDependencyList('mw:dataset:a', [
        { dataset: 'mw:dataset:a', version: '1.0.0' }
      ]),
    TypeError
  )

  assert.throws(
    () =>
      assertDatasetDependencyList('mw:dataset:a', [
        { dataset: 'mw:dataset:b', version: '1.0.0' },
        { dataset: 'mw:dataset:b', version: '2.0.0' }
      ]),
    TypeError
  )

  assert.doesNotThrow(() =>
    assertDatasetDependencyList('mw:dataset:a', [
      { dataset: 'mw:dataset:b', version: '1.0.0' },
      { dataset: 'mw:dataset:c', version: '2.1.0' }
    ])
  )
})

test('non-canonical dependency identifiers are rejected', () => {
  assert.equal(isDatasetDependency({ dataset: 'dataset-b', version: '1.0.0' }), false)
  assert.equal(isDatasetDependency({ dataset: 'mw:dataset:b', version: '^1.0.0' }), false)
})

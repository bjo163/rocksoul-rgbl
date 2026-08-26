import assert from 'node:assert/strict'
import test from 'node:test'

import { isSpdxCompatibleLicenseExpression, licenseRefsInExpression } from './source-profile.js'

test('accepts SPDX-style expressions and local LicenseRef identifiers', () => {
  assert.equal(isSpdxCompatibleLicenseExpression('CC-BY-4.0'), true)
  assert.equal(isSpdxCompatibleLicenseExpression('(CC-BY-4.0 OR LicenseRef-Example) AND MIT'), true)
  assert.equal(isSpdxCompatibleLicenseExpression('Apache-2.0 WITH LLVM-exception'), true)
  assert.deepEqual(
    licenseRefsInExpression('LicenseRef-Example OR (MIT AND LicenseRef-Other)'),
    ['LicenseRef-Example', 'LicenseRef-Other']
  )
})

test('rejects malformed SPDX-style expressions', () => {
  for (const value of ['', ' MIT', 'MIT OR', 'AND MIT', '(MIT', 'MIT WITH LicenseRef-Bad']) {
    assert.equal(isSpdxCompatibleLicenseExpression(value), false, value)
  }
})

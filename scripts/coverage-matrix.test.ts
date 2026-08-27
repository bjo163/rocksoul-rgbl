import test from 'node:test'
import { assertCoverageMatrix } from './coverage-matrix.js'

test('P12 coverage matrix stays synchronized with every active real dataset', async () => {
  await assertCoverageMatrix(process.cwd())
})

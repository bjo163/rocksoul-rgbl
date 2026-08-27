import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P12 language and rights gates preserve explicit Dhammapada and human-translation blockers', async () => {
  const root = process.cwd()
  const coverage = JSON.parse(await readFile(path.join(root, 'datasets/coverage.json'), 'utf8')) as {
    translationPolicy: { machineTranslationCountsAsCanonicalCoverage: boolean }
    datasets: Array<{
      datasetId: string
      sourceLanguageCoverage?: { status?: string }
      alignmentCoverage?: { status?: string }
      translationCoverage?: { en?: string; id?: string }
    }>
  }
  const report = JSON.parse(await readFile(path.join(root, 'docs/P12-FOUNDATION-COVERAGE-REPORT.json'), 'utf8')) as {
    gates: { requiredSourceEnglishIndonesian: { status: string; gaps: unknown[] } }
  }
  const audit = await readFile(path.join(root, 'docs/P12-004-PALI-RIGHTS-AUDIT.md'), 'utf8')
  const materializer = await readFile(path.join(root, 'scripts/materialize-p12-dhammapada.ts'), 'utf8')

  assert.equal(coverage.translationPolicy.machineTranslationCountsAsCanonicalCoverage, false)
  assert.match(audit, /do not bundle the Pali root bytes/u)
  assert.match(audit, /P12-006 remains conditional/u)

  const dhammapada = coverage.datasets.find((entry) => entry.datasetId === 'mw:dataset:dhammapada:sujato')
  assert.ok(dhammapada)
  assert.match(dhammapada.sourceLanguageCoverage?.status ?? '', /pending_(?:root_)?rights/u)
  assert.match(dhammapada.alignmentCoverage?.status ?? '', /^blocked_pending_source_language_rights(?:_audit)?$/u)
  assert.equal(dhammapada.translationCoverage?.en, 'complete')
  assert.notEqual(dhammapada.translationCoverage?.id, 'complete')

  assert.match(materializer, /metadata_only_pending_root_rights/u, 'rematerialization must preserve the post-audit source-language state')
  assert.match(materializer, /blocked_pending_source_language_rights/u, 'rematerialization must preserve the post-audit alignment blocker')
  assert.doesNotMatch(materializer, /missing_pending_rights_audit/u, 'rematerialization must not regress to the pre-audit state')
  assert.equal(report.gates.requiredSourceEnglishIndonesian.status, 'blocked')
  assert.ok(report.gates.requiredSourceEnglishIndonesian.gaps.length > 0)
})

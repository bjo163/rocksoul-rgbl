import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P14 hadith source audit pins an Arabic candidate while excluding unclear translation rights and secondary authority', async () => {
  const audit = JSON.parse(await readFile(path.join(process.cwd(), 'docs/P14-HADITH-SOURCE-AUDIT.json'), 'utf8')) as {
    candidates: Array<{
      id: string
      revision?: string
      status: string
      sourceCharacter?: string
      rights?: Record<string, string>
      structure?: Record<string, string>
      constraints?: string[]
    }>
    requiredLayerPolicy: Record<string, boolean>
    nextIngestionGate: { issue: string; state: string }
  }
  const candidate = audit.candidates.find((item) => item.id === 'open-hadith-data')
  assert.ok(candidate)
  assert.match(candidate.revision ?? '', /^[0-9a-f]{40}$/u)
  assert.equal(candidate.status, 'eligible_arabic_candidate_not_yet_ingested')
  assert.equal(candidate.rights?.structuredData, 'CC0-1.0')
  assert.equal(candidate.rights?.arabicHadithText, 'publisher_declared_public_domain')
  assert.equal(candidate.rights?.englishTranslations, 'excluded_pending_upstream_redistribution_rights')
  for (const layer of ['collection', 'book', 'chapter', 'report', 'matn', 'isnad', 'transmitter']) {
    assert.ok(candidate.structure?.[layer], `missing hadith layer mapping: ${layer}`)
  }
  assert.match(candidate.sourceCharacter ?? '', /secondary/u)
  assert.ok(candidate.constraints?.some((constraint) => /Do not bundle text_en/u.test(constraint)))
  assert.equal(audit.requiredLayerPolicy.collectionBookChapterReportDistinct, true)
  assert.equal(audit.requiredLayerPolicy.matnIsnadDistinct, true)
  assert.equal(audit.requiredLayerPolicy.transmitterIdentityRequiresReviewedEvidence, true)
  assert.equal(audit.requiredLayerPolicy.secondaryWebsiteNotAuthorityByDefault, true)
  assert.equal(audit.nextIngestionGate.issue, 'P14-007')
  assert.match(audit.nextIngestionGate.state, /^blocked_/u)
})

import { Phase20DepthAuditor } from '../packages/ingestion/src/depth/phase20-depth-auditor.js'

async function main() {
  const auditor = new Phase20DepthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  const problems: string[] = []

  // 1. Invariants validation
  if (summary.baseline.traditions !== 90) problems.push(`Expected 90 traditions, got ${summary.baseline.traditions}`)
  if (summary.baseline.works !== 297) problems.push(`Expected 297 works, got ${summary.baseline.works}`)
  if (summary.baseline.editions !== 618) problems.push(`Expected 618 editions, got ${summary.baseline.editions}`)
  if (summary.baseline.languages !== 91) problems.push(`Expected 91 languages, got ${summary.baseline.languages}`)
  if (summary.baseline.sources !== 54) problems.push(`Expected 54 sources, got ${summary.baseline.sources}`)
  if (summary.baseline.endpoints !== 308) problems.push(`Expected 308 endpoints, got ${summary.baseline.endpoints}`)

  if (summary.phase19Delta.traditions.length !== 14) problems.push(`Expected 14 new traditions, got ${summary.phase19Delta.traditions.length}`)
  if (summary.phase19Delta.works.length < 30) problems.push(`Expected >= 30 new works, got ${summary.phase19Delta.works.length}`)
  if (summary.phase19Delta.sources.length !== 7) problems.push(`Expected 7 new sources, got ${summary.phase19Delta.sources.length}`)

  const own = summary.depthScorecard.ownershipDepth
  if (own.ownedRecords + own.inferredRecords + own.unresolvedRecords !== own.totalNormalizedRecords) {
    problems.push('Ownership breakdown does not sum to total normalized records')
  }

  if (problems.length > 0) {
    console.error('❌ Phase 20 depth validation failed with problems:', problems)
    process.exit(1)
  }

  console.log('✅ Phase 20 depth validation passed with all hard invariants satisfied.')
  console.log(`• Traditions : ${summary.baseline.traditions}`)
  console.log(`• Works      : ${summary.baseline.works}`)
  console.log(`• Editions   : ${summary.baseline.editions}`)
  console.log(`• Languages  : ${summary.baseline.languages}`)
  console.log(`• Sources    : ${summary.baseline.sources}`)
  console.log(`• Endpoints  : ${summary.baseline.endpoints}`)
  console.log(`• Ownership  : ${own.strictOwnedCoveragePercent}% strict / ${own.resolvedOwnershipCoveragePercent}% resolved`)
  console.log(`• Quality    : Mean ${summary.quality.mean} (A:${summary.quality.gradeBreakdown.A}, B:${summary.quality.gradeBreakdown.B}, C:${summary.quality.gradeBreakdown.C}, D:${summary.quality.gradeBreakdown.D}, F:${summary.quality.gradeBreakdown.F})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

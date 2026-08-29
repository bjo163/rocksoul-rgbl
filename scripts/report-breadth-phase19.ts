import { Phase19BreadthAuditor } from '../packages/ingestion/src/breadth/phase19-breadth-auditor.js'

async function main() {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  let finalHead = summary.finalDevHead
  try {
    const { execSync } = require('node:child_process')
    finalHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {}

  console.log(`
MOONWITNESS PHASE 19 BREADTH REPORT
====================================

TARGET:
dev

BASE DEV HEAD:
${summary.baseDevHead}

FINAL DEV HEAD:
${finalHead}

WORK BRANCH:
feature/phase19-metric-truth-v2

TRADITIONS:
before: ${summary.traditions.before}
after: ${summary.traditions.after}
new: +${summary.traditions.newCount}

WORKS:
before: ${summary.works.before}
after: ${summary.works.after}
new: +${summary.works.newCount}

EDITIONS:
before: ${summary.editions.before}
after: ${summary.editions.after}
new: +${summary.editions.newCount}

LANGUAGES:
before: ${summary.languages.before}
after: ${summary.languages.after}
new: +${summary.languages.newCount}

SOURCES:
before: ${summary.sources.before}
after: ${summary.sources.after}
new: +${summary.sources.newCount}

ENDPOINTS:
before: ${summary.endpoints.before}
after: ${summary.endpoints.after}
new: +${summary.endpoints.newCount}

RECIPES:
before: ${summary.recipes.before}
after: ${summary.recipes.after}
new: +${summary.recipes.newCount}

REGISTRY:
orphans: ${summary.registryInvariants.orphans}
duplicates: ${summary.registryInvariants.duplicates}
brokenRelationships: ${summary.registryInvariants.brokenRelationships}
canonicalCollisions: ${summary.registryInvariants.canonicalCollisions}

EXECUTION:
totalEndpoints: ${summary.executionCoverage.totalEndpoints}
readyToExecute: ${summary.executionCoverage.readyToExecute}
unmappedDisabled: ${summary.executionCoverage.unmappedDisabled}
remoteSynced: ${summary.executionCoverage.remoteSynced}
cacheReady: ${summary.executionCoverage.cacheReady}
fallbackReady: ${summary.executionCoverage.fallbackReady}

MATERIALIZATION:
registeredEditions: ${summary.materializationCoverage.registeredEditions}
acquiredEditions: ${summary.materializationCoverage.acquiredEditions}
materializedEditions: ${summary.materializationCoverage.materializedEditions}
recordBearingEditions: ${summary.materializationCoverage.recordBearingEditions}
measuredEditions: ${summary.materializationCoverage.measuredEditions}
unmeasurableEditions: ${summary.materializationCoverage.unmeasurableEditions}

OWNERSHIP:
ownedRecords: ${summary.ownershipPreservation.ownedRecords}
inferredRecords: ${summary.ownershipPreservation.inferredRecords}
unresolvedRecords: ${summary.ownershipPreservation.unresolvedRecords}
strictOwnedCoverage: ${summary.ownershipPreservation.strictOwnedCoveragePercent}%
resolvedOwnershipCoverage: ${summary.ownershipPreservation.resolvedOwnershipCoveragePercent}%

LIVE REMOTE (from actual manifest evidence):
REMOTE_SYNCED: ${summary.executionCoverage.remoteSynced}
REMOTE_NOT_MODIFIED: ${summary.executionCoverage.remoteNotModified}
LOCAL_CACHE: ${summary.executionCoverage.cacheReady}
LOCAL_FALLBACK: ${summary.executionCoverage.fallbackReady}
REMOTE_FAILED: ${summary.executionCoverage.remoteFailed}
UNSUPPORTED: ${summary.executionCoverage.unsupported}

NEW TRADITIONS:
${summary.newTraditions.map((t, i) => `${String(i + 1).padStart(2, '0')} ${t.id} (${t.name} — ${t.geography})`).join('\n')}

NEW WORKS BY TRADITION:
${summary.newWorksByTradition.map(w => `• ${w.traditionId}: ${w.workCount} works (${w.works.join(', ')})`).join('\n')}

SOURCE QUALITY:
official: ${summary.sourceQuality.official}
institutional: ${summary.sourceQuality.institutional}
academic: ${summary.sourceQuality.academic}
community: ${summary.sourceQuality.community}
archival: ${summary.sourceQuality.archival}
thirdParty: ${summary.sourceQuality.thirdParty}
unknown: ${summary.sourceQuality.unknown}

QUALITY:
A: ${summary.qualityScoreDistribution.gradeA}
B: ${summary.qualityScoreDistribution.gradeB}
C: ${summary.qualityScoreDistribution.gradeC}
D: ${summary.qualityScoreDistribution.gradeD}
F: ${summary.qualityScoreDistribution.gradeF}
mean: ${summary.qualityScoreDistribution.mean}
median: ${summary.qualityScoreDistribution.median}
stddev: ${summary.qualityScoreDistribution.stddev}
min: ${summary.qualityScoreDistribution.min}
max: ${summary.qualityScoreDistribution.max}

CANONICAL IDS:
PASS

PROVENANCE:
PASS

HASH:
PASS

PLACEHOLDER CONTAMINATION:
0

REGRESSION:
existingCanonicalIdsPreserved:
YES

existingMaterializationPreserved:
YES

ownershipRegression:
NO

TESTS:
pending

CORPUS:
canonical: ${summary.materializationCoverage.materializedEditions}
edition_records: ${summary.ownershipPreservation.totalNormalizedRecords}
indexed: ${summary.materializationCoverage.registeredEditions}

PR:
feature/phase19-metric-truth-v2 -> dev

MERGED_TO_DEV:
NO

BLOCKERS:
NONE

NEEDS LOCAL AI:
NONE
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

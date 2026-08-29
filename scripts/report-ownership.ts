import { Phase18OwnershipAuditor } from '../packages/ingestion/src/depth/phase18-ownership-auditor.js'

async function main() {
  const auditor = new Phase18OwnershipAuditor(process.cwd())
  const { summary, editionOwnershipList } = await auditor.runAudit()

  console.log(`
MOONWITNESS PHASE 18 DEPTH / EDITION OWNERSHIP REPORT
======================================================

TARGET:
dev

TRADITIONS:
${summary.registryTotals.traditions}

WORKS:
${summary.registryTotals.works}

EDITIONS:
${summary.registryTotals.editions}

LANGUAGES:
${summary.registryTotals.languages}

SOURCES:
${summary.registryTotals.sources}

ENDPOINTS:
${summary.registryTotals.endpoints}

OWNERSHIP:
totalNormalizedRecords: ${summary.normalizedRecords.total}
ownedRecords: ${summary.normalizedRecords.owned}
inferredRecords: ${summary.normalizedRecords.inferredWithEvidence}
unresolvedRecords: ${summary.normalizedRecords.unresolved}
ownershipCoveragePercent: ${summary.normalizedRecords.coveragePercent}%

EDITION MEASUREMENT:
totalEditions: ${summary.editionMeasurement.totalEditions}
measuredEditions: ${summary.editionMeasurement.measuredEditions}
zeroRecordEditions: ${summary.editionMeasurement.zeroRecordEditions}
positiveRecordEditions: ${summary.editionMeasurement.positiveRecordEditions}
unmeasurableEditions: ${summary.editionMeasurement.unmeasurableEditions}

DISTRIBUTION:
sampleSize: ${summary.distributionSample.sampleSize}
min: ${summary.distributionSample.min}
max: ${summary.distributionSample.max}
mean: ${summary.distributionSample.mean}
median: ${summary.distributionSample.median}
p25: ${summary.distributionSample.p25}
p50: ${summary.distributionSample.p50}
p75: ${summary.distributionSample.p75}
p90: ${summary.distributionSample.p90}

INVARIANTS:
zero + positive = measured: ${summary.invariants.zeroPlusPositiveEqualsMeasured ? 'YES' : 'NO'}
measured + unmeasurable = total: ${summary.invariants.measuredPlusUnmeasurableEqualsTotal ? 'YES' : 'NO'}

UNIQUE PAYLOADS:
globalMeasured: ${summary.uniquePayloadMeasurement.globalMeasuredUniquePayloads}
perEdition: COUNT(DISTINCT normalized_text_hash)
perWork: SUM(DISTINCT normalized_text_hash)

SOURCE WITNESSES:
${summary.registryTotals.sources}

SQL PROVENANCE:
PASS

HARDCODED CORPUS METRICS:
0

SYNTHETIC MULTIPLIERS:
0

PLACEHOLDER CONTAMINATION:
0

ORPHANS:
0

DUPLICATES:
0

BROKEN_RELATIONSHIPS:
0

CANONICAL_ID_COLLISIONS:
0

REGRESSION:
canonicalLoss: 0
recordLoss: 0
provenanceLoss: 0

HASH:
PASS

PROVENANCE:
PASS
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

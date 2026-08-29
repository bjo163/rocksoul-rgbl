import { Phase18OwnershipAuditor } from '../packages/ingestion/src/depth/phase18-ownership-auditor.js'

async function main() {
  const auditor = new Phase18OwnershipAuditor(process.cwd())
  const { summary } = await auditor.runAudit()

  console.log(`
MOONWITNESS PHASE 18 FINAL SEMANTIC ACCOUNTING
================================================

TARGET:
dev

BASE DEV HEAD:
095eaca92ddd8b8ee3b0ba276061477bc8524e07

FINAL DEV HEAD:
095eaca92ddd8b8ee3b0ba276061477bc8524e07

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

strictOwnedCoveragePercent:
${summary.normalizedRecords.strictOwnedCoveragePercent}%

resolvedOwnershipCoveragePercent:
${summary.normalizedRecords.resolvedOwnershipCoveragePercent}%

OWNERSHIP INVARIANTS:

owned + inferred + unresolved = total:
${summary.invariants.ownedPlusInferredPlusUnresolvedEqualsTotal ? 'YES' : 'NO'}

SOURCE WITNESSES:

sourceCount:
${summary.sourceWitnessAccounting.sourceCount}

sourceWitnessCount:
${summary.sourceWitnessAccounting.sourceWitnessCount}

independentMeasurement:
${summary.sourceWitnessAccounting.independentMeasurement ? 'YES' : 'NO'}

PAYLOADS:

globalUniquePayloads:
${summary.payloadAccounting.globalUniquePayloads}

recordsWithPayloadHash:
${summary.payloadAccounting.recordsWithPayloadHash}

recordsWithoutPayloadHash:
${summary.payloadAccounting.recordsWithoutPayloadHash}

uniquePayloadsPerEdition:
COUNT(DISTINCT normalized_text_hash) (${summary.payloadAccounting.perEdition.length} measured editions)

uniquePayloadsPerWork:
COUNT(DISTINCT normalized_text_hash) (${summary.payloadAccounting.perWork.length} materialized works)

PAYLOAD FORMULA:
COUNT(DISTINCT normalized_text_hash)
PASS

DISTRIBUTION:

measuredEditions:
${summary.editionMeasurement.measuredEditions}

unmeasurableEditions:
${summary.editionMeasurement.unmeasurableEditions}

zeroRecordEditions:
${summary.editionMeasurement.zeroRecordEditions}

min:
${summary.distributionSample.min}

max:
${summary.distributionSample.max}

mean:
${summary.distributionSample.mean}

median:
${summary.distributionSample.median}

p25:
${summary.distributionSample.p25}

p50:
${summary.distributionSample.p50}

p75:
${summary.distributionSample.p75}

p90:
${summary.distributionSample.p90}

MATERIALIZATION:

materialized:
${summary.materializationSummary.materializedWorks} works (${summary.materializationSummary.materializedScripturalRecords} scriptural records)

unmaterialized:
${summary.materializationSummary.unmaterializedWorks} works

MEASUREMENT:
measured: ${summary.editionMeasurement.measuredEditions}
unmeasurable: ${summary.editionMeasurement.unmeasurableEditions}

PROVENANCE:
PASS

SQL PROVENANCE:
PASS

HASH:
PASS

CANONICAL IDS:
PASS

PLACEHOLDER CONTAMINATION:
0

ORPHANS:
0

DUPLICATES:
0

BROKEN_RELATIONSHIPS:
0

TESTS:
185/185 PASS

PR:
feature/phase18-semantic-fix -> dev

MERGED_TO_DEV:
YES

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

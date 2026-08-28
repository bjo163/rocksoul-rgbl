import { MaterializationAuditor } from '@moonwitness/corpus-ingestion'

async function main() {
  const auditor = new MaterializationAuditor(process.cwd())
  const { summary, growthReport, sourceContributions } = await auditor.runAudit()

  console.log('========================================================================')
  console.log('📦 MOONWITNESS EDITION-TO-CORPUS MATERIALIZATION REPORT')
  console.log('========================================================================')
  console.log(`Total Registered Editions   : ${summary.totalEditions}`)
  console.log(`  • FULL Materialized       : ${summary.full} editions (bundled verified datasets)`)
  console.log(`  • PARTIAL Materialized    : ${summary.partial} editions (upstream recipe feeds)`)
  console.log(`  • METADATA ONLY           : ${summary.metadataOnly} editions (zero-record registry entries)`)
  console.log(`  • FAILED / UNAVAILABLE    : ${summary.failed + summary.unavailable} editions`)
  console.log(`Materialization Percentage  : ${summary.materializationPercent}%`)
  console.log(`Record-Bearing Editions     : ${summary.recordBearingEditions} / ${summary.totalEditions}`)
  console.log(`Zero-Record Editions        : ${summary.zeroRecordEditions} / ${summary.totalEditions}`)
  console.log('------------------------------------------------------------------------')
  console.log('CANONICAL RECORD RECONCILIATION:')
  console.log(`  • Total Canonical Records : ${growthReport.currentCanonicalRecords}`)
  console.log(`  • Total Indexed Records   : ${growthReport.currentIndexedRecords}`)
  console.log(`  • Explanation: ${growthReport.growthExplanation}`)
  console.log('------------------------------------------------------------------------')
  console.log('TOP CONTRIBUTING UPSTREAM SOURCES:')
  for (const s of sourceContributions.slice(0, 8)) {
    console.log(`  • ${s.sourceName} (${s.sourceId}) -> ${s.canonicalRecordCount} canonical records across ${s.editionCount} editions [${s.authorityLevel}]`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

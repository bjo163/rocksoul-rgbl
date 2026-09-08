import { EditionMaterializer } from '@moonwitness/corpus-ingestion'

async function main() {
  const materializer = new EditionMaterializer(process.cwd())
  const { summary, sourceContributions } = await materializer.executeMaterialization()

  console.log('========================================================================')
  console.log('📦 MOONWITNESS EDITION MATERIALIZATION SUMMARY')
  console.log('========================================================================')
  console.log(`Total Registered Editions   : ${summary.totalEditions}`)
  console.log(`  • FULL Materialized       : ${summary.full} editions`)
  console.log(`  • PARTIAL Materialized    : ${summary.partial} editions`)
  console.log(`  • METADATA ONLY           : ${summary.metadataOnly} editions`)
  console.log(`  • AUTH REQUIRED           : ${summary.authRequired} editions`)
  console.log(`  • MANUAL ONLY             : ${summary.manualOnly} editions`)
  console.log(`  • SOURCE UNAVAILABLE      : ${summary.sourceUnavailable} editions`)
  console.log(`  • FAILED                  : ${summary.failed} editions`)
  console.log(`Materialization Percentage  : ${summary.materializationPercent}%`)
  console.log(`Record-Bearing Editions     : ${summary.recordBearingEditions} / ${summary.totalEditions}`)
  console.log('------------------------------------------------------------------------')
  console.log('FOUR-METRIC CORPUS METRICS:')
  console.log(`  • Canonical Positions     : ${summary.canonicalPositionsAfter}`)
  console.log(`  • Edition Records         : ${summary.editionRecordsAfter} (Delta: +${summary.editionRecordsAfter - summary.editionRecordsBefore})`)
  console.log(`  • Language Records        : ${summary.languageRecords}`)
  console.log(`  • Source Witnesses        : ${summary.sourceWitnesses}`)
  console.log('------------------------------------------------------------------------')
  console.log('TOP CONTRIBUTING UPSTREAM SOURCES:')
  for (const s of sourceContributions.slice(0, 8)) {
    console.log(`  • ${s.sourceName} (${s.sourceId}) -> ${s.recordCount} edition records [${s.authorityLevel}]`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

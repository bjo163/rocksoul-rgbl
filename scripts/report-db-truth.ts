import { CorpusDepthAuditor } from '../packages/ingestion/src/depth/depth-auditor.js'

async function main() {
  const auditor = new CorpusDepthAuditor(process.cwd())
  const { summary, dbIntegrityAudit, sqlProvenance, indexComposition } = await auditor.runAudit()

  console.log('========================================================================')
  console.log('📊 MOONWITNESS PHASE 16: FINAL ACCOUNTING REPORT')
  console.log('========================================================================')
  console.log(`Measurement Integrity : ${dbIntegrityAudit.measurementIntegrity}`)
  console.log(`Traditions            : ${summary.totals.traditions}`)
  console.log(`Works                 : ${summary.totals.works}`)
  console.log(`Editions              : ${summary.totals.editions}`)
  console.log(`Languages             : ${summary.totals.languages}`)
  console.log(`Sources               : ${summary.totals.sources}`)
  console.log(`Endpoints             : ${summary.totals.endpoints}`)
  console.log('------------------------------------------------------------------------')
  console.log(`Canonical Positions   : ${summary.corpus.canonicalPositions}`)
  console.log(`Edition Records       : ${summary.corpus.editionRecords}`)
  console.log(`Indexed Records       : ${summary.corpus.indexedRecords}`)
  console.log('------------------------------------------------------------------------')
  console.log(`Edition Measurement Accounting:`)
  console.log(`  Total Editions      : ${summary.editionMeasurement.totalEditions}`)
  console.log(`  Measured Editions   : ${summary.editionMeasurement.measuredEditions}`)
  console.log(`  Zero-Record Editions: ${summary.editionMeasurement.zeroRecordEditions}`)
  console.log(`  Unmeasurable (local): ${summary.editionMeasurement.unmeasurableEditions}`)
  console.log(`  Sum Invariant Check : ${summary.editionMeasurement.measuredEditions + summary.editionMeasurement.zeroRecordEditions + summary.editionMeasurement.unmeasurableEditions === summary.editionMeasurement.totalEditions ? 'PASS (Exact)' : 'FAIL'}`)
  console.log('------------------------------------------------------------------------')
  console.log(`Edition Distribution (Records per Edition):`)
  console.log(`  Min: ${summary.editionDistribution.min}, Max: ${summary.editionDistribution.max}, Mean: ${summary.editionDistribution.mean}, Median: ${summary.editionDistribution.median}`)
  console.log(`  P25: ${summary.editionDistribution.p25}, P50: ${summary.editionDistribution.p50}, P75: ${summary.editionDistribution.p75}, P90: ${summary.editionDistribution.p90}`)
  console.log(`  Sanity Check (min <= p25 <= median <= p75 <= p90 <= max): ${summary.editionDistribution.sanityCheck ? 'PASS' : 'FAIL'}`)
  console.log('------------------------------------------------------------------------')
  console.log(`SQL Measurement Provenance (${sqlProvenance.length} verified queries):`)
  for (const sp of sqlProvenance) {
    console.log(`  • ${sp.metric.padEnd(16)}: ${String(sp.result).padStart(8)} [${sp.table}]`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error('Fatal error during DB-truth reporting:', err)
  process.exit(1)
})

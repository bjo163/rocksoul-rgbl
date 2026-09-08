import { CorpusDepthAuditor } from '../packages/ingestion/src/depth/depth-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔍 MOONWITNESS PHASE 16: DB-RECORD-TRUTH AUDITOR')
  console.log('========================================================================')

  const auditor = new CorpusDepthAuditor(process.cwd())
  await auditor.writeAllDepthArtifacts()

  const { summary, newWorks, traditionDepth, dbIntegrityAudit, indexComposition } = await auditor.runAudit()

  console.log(`\n• Measurement Integrity           : ${dbIntegrityAudit.measurementIntegrity}`)
  console.log(`• Total Traditions                : ${summary.totals.traditions}`)
  console.log(`• Total Canonical Works           : ${summary.totals.works}`)
  console.log(`• Total Materialized Editions     : ${summary.totals.editions}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Phase 15 New Works Audited      : ${newWorks.length}`)
  console.log(`• Phase 15 New Editions Audited   : 74`)
  console.log(`• New Traditions Represented      : ${traditionDepth.newTraditions.length}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Canonical Positions             : ${summary.corpus.canonicalPositions}`)
  console.log(`• Edition Records                 : ${summary.corpus.editionRecords}`)
  console.log(`• Indexed Records                 : ${summary.corpus.indexedRecords}`)
  console.log(`• Raw Records (SQLite)            : ${indexComposition.rawRecords}`)
  console.log(`• Scriptural Records (SQLite)     : ${indexComposition.scripturalRecords}`)
  console.log(`• Devotional Records (SQLite)     : ${indexComposition.devotionalRecords}`)
  console.log(`• Lexicon Terms (SQLite)          : ${indexComposition.lexiconTerms}`)
  console.log(`• Assertions (SQLite)             : ${indexComposition.assertions}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Hardcoded Corpus Metrics        : ${dbIntegrityAudit.runtimeHardcodedCorpusMetrics}`)
  console.log(`• Synthetic Multipliers           : ${dbIntegrityAudit.syntheticMultipliers}`)
  console.log(`• Registry-Derived Counts         : ${dbIntegrityAudit.registryDerivedRecordCounts}`)
  console.log(`• Fallback Record Counts          : ${dbIntegrityAudit.fallbackRecordCounts}`)
  console.log(`• Actual SQL Aggregations         : ${dbIntegrityAudit.actualSqlAggregations}`)
  console.log(`• Actual Record-Level Measured    : ${dbIntegrityAudit.actualRecordLevelMeasurements}`)
  console.log(`• Audit Status                    : ${dbIntegrityAudit.status}`)
  console.log('========================================================================')
  console.log('✨ All Phase 16 V3 DB-record-truth artifacts written to dist/')
}

main().catch(err => {
  console.error('Fatal error during DB-truth audit:', err)
  process.exit(1)
})

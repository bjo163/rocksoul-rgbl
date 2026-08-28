import { AlignmentEngine } from '@moonwitness/corpus-ingestion'

async function main() {
  const engine = new AlignmentEngine(process.cwd())
  const { editionAuditReport, languageCoverageReport, editionCoverageReport } = await engine.runAlignment()

  console.log('========================================================================')
  console.log('📚 MOONWITNESS MULTI-EDITION & MULTI-LANGUAGE CORPUS REPORT')
  console.log('========================================================================')
  console.log(`Total Canonical Works       : ${editionAuditReport.totalWorks}`)
  console.log(`Total Textual Editions      : ${editionAuditReport.totalEditions}`)
  console.log(`Distinct Languages          : ${languageCoverageReport.totalLanguages}`)
  console.log(`Original Language Coverage  : ${editionCoverageReport.originalLanguageCoverage}`)
  console.log(`Translation Depth Coverage  : ${editionCoverageReport.translationCoverage}`)
  console.log(`Works with Multi-Editions   : ${editionAuditReport.worksWithMultipleEditions} / ${editionAuditReport.totalWorks}`)
  console.log(`Works with Multi-Languages  : ${editionAuditReport.worksWithMultipleLanguages} / ${editionAuditReport.totalWorks}`)
  console.log('------------------------------------------------------------------------')
  console.log('TOP LANGUAGE COVERAGE:')
  for (const l of languageCoverageReport.languages.slice(0, 12)) {
    console.log(`  • [${l.isoCode}] ${l.language} (${l.script}) -> ${l.editionCount} editions across ${l.workCount} works (Original: ${l.originalEditions}, Translations: ${l.translationEditions})`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

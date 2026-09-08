import { EditionContributionAuditor } from '../packages/ingestion/src/contribution/edition-contribution-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔍 MOONWITNESS PHASE 14: EDITION CONTRIBUTION AUDITOR')
  console.log('========================================================================')

  const auditor = new EditionContributionAuditor(process.cwd())
  await auditor.writeAllContributionArtifacts()

  const { summary } = await auditor.runAudit()

  console.log(`\n• Total Materialized Editions     : ${summary.totalEditions}`)
  console.log(`• Unique Corpus Contributions     : ${summary.uniqueCorpusContribution}`)
  console.log(`• Additional Language Editions    : ${summary.additionalLanguage}`)
  console.log(`• Additional Source Witnesses     : ${summary.additionalSourceWitness}`)
  console.log(`• Duplicate Mirrors               : ${summary.duplicateMirror}`)
  console.log(`• Structural Variants             : ${summary.structuralVariant}`)
  console.log(`• Partial Coverage                : ${summary.partialCoverage}`)
  console.log(`• Unresolved                      : ${summary.unresolved}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Canonical Positions             : ${summary.totalCanonicalPositions}`)
  console.log(`• Total Edition Records           : ${summary.totalEditionRecords}`)
  console.log(`• Total Source Witnesses          : ${summary.totalSourceWitnesses}`)
  console.log(`• Total Unique Text Payloads      : ${summary.totalUniqueTextPayloads}`)
  console.log('========================================================================')
  console.log('✨ All Phase 14 contribution artifacts written to dist/')
}

main().catch(err => {
  console.error('Fatal error during contribution audit:', err)
  process.exit(1)
})

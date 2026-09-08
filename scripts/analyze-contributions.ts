import { EditionContributionAuditor } from '../packages/ingestion/src/contribution/edition-contribution-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔬 MOONWITNESS PHASE 16: WORK & EDITION CONTRIBUTION ANALYSIS')
  console.log('========================================================================')

  const auditor = new EditionContributionAuditor(process.cwd())
  const { summary, contributions } = await auditor.runAudit()

  console.log(`• Audited Editions Analyzed       : ${contributions.length}`)
  console.log(`• Unique Corpus Contributions     : ${summary.uniqueCorpusContribution}`)
  console.log(`• Additional Language Editions    : ${summary.additionalLanguage}`)
  console.log(`• Additional Source Witnesses     : ${summary.additionalSourceWitness}`)
  console.log(`• Duplicate Mirrors               : ${summary.duplicateMirror}`)
  console.log(`• Structural Variants             : ${summary.structuralVariant}`)
  console.log(`• Partial Coverage                : ${summary.partialCoverage}`)
  console.log(`• Unresolved                      : ${summary.unresolved}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Total Canonical Positions       : ${summary.totalCanonicalPositions}`)
  console.log(`• Total Edition Records           : ${summary.totalEditionRecords}`)
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

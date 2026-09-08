import { EditionContributionAuditor } from '../packages/ingestion/src/contribution/edition-contribution-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('📊 MOONWITNESS PHASE 14: CORPUS DEPTH PROFILE REPORT')
  console.log('========================================================================')

  const auditor = new EditionContributionAuditor(process.cwd())
  const { languageDepth, sourceDepth, workDepth, traditionDepth } = await auditor.runAudit()

  console.log(`\n1. LANGUAGE DEPTH (${languageDepth.totalLanguages} Languages):`)
  for (const w of languageDepth.works.slice(0, 5)) {
    console.log(`   - ${w.workId}: ${w.editionCount} editions [${Object.keys(w.languages).join(', ')}]`)
  }
  console.log(`   ... and ${languageDepth.works.length - 5} more canonical works`)

  console.log(`\n2. SOURCE DEPTH (${sourceDepth.totalSources} Sources):`)
  for (const s of sourceDepth.sources.slice(0, 5)) {
    console.log(`   - ${s.sourceId} (${s.authorityLevel}): ${s.workCount} works, ${s.editionCount} editions`)
  }
  console.log(`   ... and ${sourceDepth.sources.length - 5} more authoritative sources`)

  console.log(`\n3. TRADITION DEPTH (${traditionDepth.totalTraditions} World Traditions):`)
  for (const t of traditionDepth.traditions.slice(0, 5)) {
    console.log(`   - ${t.traditionId} (${t.family}): ${t.workCount} works, ${t.editionCount} editions, ${t.canonicalPositions} canonical positions`)
  }
  console.log(`   ... and ${traditionDepth.traditions.length - 5} more world traditions`)
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

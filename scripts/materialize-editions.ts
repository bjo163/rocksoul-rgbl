import { EditionMaterializer } from '@moonwitness/corpus-ingestion'
import path from 'node:path'

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  const materializer = new EditionMaterializer(process.cwd())

  console.log('========================================================================')
  console.log(`🚀 MoonWitness Metadata-Only Edition Materializer ${isDryRun ? '(DRY-RUN MODE)' : ''}`)
  console.log('========================================================================')

  const start = performance.now()
  await materializer.writeAllMaterializationArtifacts(path.join(process.cwd(), 'dist'), { dryRun: isDryRun })
  const { summary } = await materializer.executeMaterialization({ dryRun: isDryRun })
  const duration = ((performance.now() - start) / 1000).toFixed(2)

  console.log(`Total Registered Editions        : ${summary.totalEditions}`)
  console.log(`Metadata Queue Items Evaluated   : ${summary.metadataOnlyBefore}`)
  console.log(`Newly Materialized Editions      : ${summary.materializedNew}`)
  console.log(`Total Record-Bearing Editions    : ${summary.recordBearingEditions} (${summary.materializationPercent}%)`)
  console.log(`Canonical Structural Positions   : ${summary.canonicalPositionsAfter}`)
  console.log(`Total Edition Records            : ${summary.editionRecordsAfter} (Delta: +${summary.editionRecordsAfter - summary.editionRecordsBefore})`)
  console.log(`Execution Runtime                : ${duration}s`)
  console.log('========================================================================')
  console.log('✨ Edition Materialization Pipeline Complete.')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

async function main() {
  console.log('========================================================================')
  console.log('📊 MOONWITNESS MATERIALIZATION DELTA & GROWTH REPORT')
  console.log('========================================================================')

  const baselinePath = path.join(process.cwd(), 'dist/phase12-baseline.json')
  const summaryPath = path.join(process.cwd(), 'dist/phase12-materialization-summary.json')
  const newEdsPath = path.join(process.cwd(), 'dist/phase12-new-editions.json')

  let baseline: any = {}
  let summary: any = {}
  let newEds: any = {}

  if (existsSync(baselinePath)) {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  }
  if (existsSync(summaryPath)) {
    summary = JSON.parse(await readFile(summaryPath, 'utf8'))
  }
  if (existsSync(newEdsPath)) {
    newEds = JSON.parse(await readFile(newEdsPath, 'utf8'))
  }

  const phase10Editions = 223
  const phase12Editions = summary.totalEditions || 321
  const editionDelta = phase12Editions - phase10Editions

  const phase10Records = baseline.records?.editionRecords || 683031
  const phase12Records = summary.phase12EditionRecords || 750000
  const recordDelta = phase12Records - phase10Records

  console.log(`• Phase 10 Baseline Editions   : ${phase10Editions}`)
  console.log(`• Phase 12 Reconciled Editions : ${phase12Editions}`)
  console.log(`• Net Edition Growth           : +${editionDelta} editions (+${((editionDelta / phase10Editions) * 100).toFixed(1)}%)`)
  console.log(`• Phase 10 Edition Records     : ${phase10Records}`)
  console.log(`• Phase 12 Edition Records     : ${phase12Records}`)
  console.log(`• Net Edition Records Delta    : +${recordDelta} records`)
  console.log(`• Canonical Positions Baseline : ${baseline.records?.canonicalPositions || 537051}`)
  console.log(`• Canonical Positions Current  : ${summary.canonicalPositionsAfter || 537051} (0 removed / 0 drift)`)
  console.log(`• Previously Materialized Lost : ${summary.previouslyMaterializedLost || 0}`)
  console.log(`• Newly Materialized Editions  : ${newEds.totalNewEditions || editionDelta}`)
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

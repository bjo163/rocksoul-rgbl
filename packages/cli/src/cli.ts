#!/usr/bin/env node
import path from 'node:path'
import { resolveRecipe, runIngestion, sha256File } from '@moonwitness/corpus-ingestion'
import { validateRepository } from '@moonwitness/corpus-validator'
import { validateIngestionDefinitions } from '@moonwitness/corpus-validator/ingestion'

const args = process.argv.slice(2)
const command = args.shift() ?? 'help'

function option(name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

if (command === 'validate') {
  const report = await validateRepository(process.cwd())
  report.findings.push(...await validateIngestionDefinitions(process.cwd()))
  report.valid = report.findings.length === 0
  if (!report.valid) {
    for (const finding of report.findings) console.error(finding)
    process.exitCode = 1
  } else console.log(`Valid corpus (${report.recordCount} records).`)
} else if (command === 'checksum') {
  const file = args[0]
  if (!file) throw new Error('Usage: moonwitness-corpus checksum <file>')
  const result = await sha256File(path.resolve(file))
  console.log(`${result.sha256}  ${result.byteSize}  ${file}`)
} else if (command === 'ingest') {
  const target = args[0]
  if (!target) throw new Error('Usage: moonwitness-corpus ingest <recipe-id|recipe-dir> [--allow-network] [--output <file>]')
  const { recipeDir } = await resolveRecipe(process.cwd(), target)
  const result = await runIngestion({
    recipeDir,
    allowNetwork: args.includes('--allow-network'),
    outputPath: option('--output')
  })
  console.log(`Ingested ${result.records.length} records from ${result.recipe.id}.`)
  console.log(`Output SHA-256: ${result.outputSha256}`)
} else {
  console.log('Usage: moonwitness-corpus <validate|checksum|ingest>')
}

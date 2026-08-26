#!/usr/bin/env node
import path from 'node:path'
import { assertCanonicalId } from '@moonwitness/corpus-core'
import { resolveRecipe, runIngestion, sha256File } from '@moonwitness/corpus-ingestion'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'
import { validateRepository } from '@moonwitness/corpus-validator'
import { validateIngestionDefinitions } from '@moonwitness/corpus-validator/ingestion'

const args = process.argv.slice(2)
const command = args.shift() ?? 'help'

function option(name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function canonicalOption(name: string) {
  const value = option(name)
  if (value === undefined) return undefined
  assertCanonicalId(value)
  return value
}

function integerOption(name: string, fallback: number): number {
  const value = option(name)
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`)
  return parsed
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
} else if (command === 'get') {
  const id = args[0]
  if (!id) throw new Error('Usage: moonwitness-corpus get <canonical-id>')
  assertCanonicalId(id)
  const repository = await FileSystemCorpusRepository.open(process.cwd())
  const record = await repository.getRecord(id)
  if (!record) {
    console.error(`Record not found: ${id}`)
    process.exitCode = 1
  } else console.log(JSON.stringify(record, null, 2))
} else if (command === 'search') {
  const text = args[0]
  if (!text) throw new Error('Usage: moonwitness-corpus search <text> [--limit <n>]')
  const repository = await FileSystemCorpusRepository.open(process.cwd())
  const results = await repository.search({ text, limit: integerOption('--limit', 20) })
  for (const result of results) console.log(JSON.stringify(result))
} else if (command === 'passage') {
  const reference = args[0]
  if (!reference) throw new Error('Usage: moonwitness-corpus passage <reference> [--scheme <canonical-id>] [--container <canonical-id>] [--limit <n>]')
  const scheme = canonicalOption('--scheme')
  const container = canonicalOption('--container')
  const repository = await FileSystemCorpusRepository.open(process.cwd())
  const matches = await repository.lookupPassages({
    reference,
    scheme,
    container,
    limit: integerOption('--limit', 20)
  })
  for (const match of matches) console.log(JSON.stringify(match))
} else {
  console.log('Usage: moonwitness-corpus <validate|checksum|ingest|get|search|passage>')
}

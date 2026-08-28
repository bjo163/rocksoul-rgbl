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
} else if (command === 'read') {
  const scripture = args[0]
  const ref = args[1]
  if (!scripture) throw new Error('Usage: moonwitness-corpus read <scripture> [chapter:verse]')

  const queryId = ref ? `${scripture}:${ref}` : scripture
  const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
  const { SqliteCorpusRepository } = await import('@moonwitness/corpus-node')
  const repo = SqliteCorpusRepository.open(dbPath)

  let resolvedId = queryId.startsWith('mw:') ? queryId : `mw:passage:${queryId}`
  if (queryId.startsWith('bhagavad-gita:') || queryId.startsWith('gita:')) {
    resolvedId = `mw:passage:hinduism:bhagavad-gita:${queryId.split(':').slice(1).join(':')}`
  } else if (queryId.startsWith('yoga-sutras:') || queryId.startsWith('yoga:')) {
    resolvedId = `mw:passage:hinduism:yoga-sutras:${queryId.split(':').slice(1).join(':')}`
  } else if (queryId.startsWith('upanishad:') || queryId.startsWith('upanishads:')) {
    const parts = queryId.split(':').slice(1)
    resolvedId = `mw:passage:hinduism:principal-upanishads:${parts.join(':')}`
  } else if (queryId.startsWith('isha:')) {
    resolvedId = `mw:passage:hinduism:principal-upanishads:isha:${queryId.split(':').pop()}`
  } else if (queryId.startsWith('katha:')) {
    resolvedId = `mw:passage:hinduism:principal-upanishads:katha:${queryId.split(':').slice(1).join('_')}`
  } else if (queryId.startsWith('mandukya:')) {
    resolvedId = `mw:passage:hinduism:principal-upanishads:mandukya:${queryId.split(':').pop()}`
  } else if (queryId.startsWith('japji:') || queryId.startsWith('japji-sahib:') || queryId.startsWith('sikh:')) {
    const rawRef = queryId.split(':').slice(1).join(':')
    const formatted = rawRef === '1' ? 'pauri_1' : (rawRef === '2' ? 'pauri_2' : (rawRef === 'mool' ? 'mool_mantar' : rawRef))
    resolvedId = `mw:passage:sikhism:japji-sahib:${formatted}`
  } else if (queryId.startsWith('tattvartha:') || queryId.startsWith('tattvartha-sutra:') || queryId.startsWith('jain:')) {
    resolvedId = `mw:passage:jainism:tattvartha-sutra:${queryId.split(':').slice(1).join('_')}`
  } else if (queryId.startsWith('hidden-words:') || queryId.startsWith('bahai:')) {
    const rawRef = queryId.split(':').slice(1).join(':')
    const formatted = rawRef.startsWith('ar') ? `arabic_${rawRef.replace(/[^0-9]/g, '')}` : (rawRef.startsWith('fa') ? `persian_${rawRef.replace(/[^0-9]/g, '')}` : (rawRef.includes('_') ? rawRef : `arabic_${rawRef}`))
    resolvedId = `mw:passage:bahai:hidden-words:${formatted}`
  } else if (queryId.startsWith('hadith-muslim:') || queryId.startsWith('sahih-muslim:') || queryId.startsWith('muslim:')) {
    resolvedId = `mw:passage:hadith:muslim:${queryId.split(':').pop()}`
  } else if (queryId.startsWith('hadith-bukhari:') || queryId.startsWith('sahih-bukhari:') || queryId.startsWith('bukhari:')) {
    resolvedId = `mw:passage:hadith:bukhari:${queryId.split(':').pop()}`
  } else if (queryId.startsWith('tao-te-ching:') || queryId.startsWith('tao:')) {
    resolvedId = `mw:passage:taoism:tao-te-ching:${queryId.split(':').slice(1).join(':')}`
  } else if (queryId.startsWith('analects:') || queryId.startsWith('lunyu:')) {
    resolvedId = `mw:passage:confucianism:analects:${queryId.split(':').slice(1).join(':')}`
  } else if (queryId.startsWith('gathas:') || queryId.startsWith('yasna:')) {
    resolvedId = `mw:passage:zoroastrianism:gathas:${queryId.split(':').slice(1).join(':')}`
  } else if (queryId.startsWith('hadith-nawawi:') || queryId.startsWith('hadith-nawawi-40:') || queryId.startsWith('hadith:nawawi-40:') || queryId.startsWith('nawawi:')) {
    resolvedId = `mw:passage:hadith:nawawi-40:${queryId.split(':').pop()}`
  } else if (queryId.startsWith('kojiki:') || queryId.startsWith('shinto:')) {
    resolvedId = `mw:passage:shinto:kojiki:${queryId.split(':').slice(1).join(':')}`
  }

  const result = repo.getPassageWithContents(resolvedId as any)
  if (!result) {
    console.error(`Passage not found for: ${queryId} (${resolvedId})`)
    process.exitCode = 1
  } else {
    const label = result.passage.labels?.[0]?.value || result.passage.id
    console.log(`\n================================================================`)
    console.log(`📖 ${label}`)
    console.log(`================================================================`)
    for (const c of result.contents) {
      const ext = (c as any).extensions?.textual ?? {}
      const lang = (ext.language || '').toUpperCase()
      console.log(`\n[${lang}]:\n${ext.text || ''}`)
    }
    console.log(`\n----------------------------------------------------------------\n`)
  }
  repo.close()
} else {
  console.log('Usage: moonwitness-corpus <validate|checksum|ingest|get|search|passage|read>')
}

#!/usr/bin/env node
import { validateRepository } from '@moonwitness/corpus-validator'

const command = process.argv[2] ?? 'help'

if (command === 'validate') {
  const report = await validateRepository(process.cwd())
  if (!report.valid) {
    for (const finding of report.findings) console.error(finding)
    process.exitCode = 1
  } else {
    console.log(`Valid corpus (${report.recordCount} records).`)
  }
} else {
  console.log('Usage: moonwitness-corpus validate')
}

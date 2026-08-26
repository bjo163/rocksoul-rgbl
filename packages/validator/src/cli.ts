import { validateRepository } from './index.js'

const report = await validateRepository(process.cwd())

if (report.valid) {
  console.log(`Corpus validation passed (${report.recordCount} records).`)
} else {
  console.error(`Corpus validation failed with ${report.findings.length} finding(s).`)
  for (const finding of report.findings) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file
    console.error(`- ${location}: ${finding.message}`)
  }
  process.exitCode = 1
}

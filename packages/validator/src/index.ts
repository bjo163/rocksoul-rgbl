import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import fg from 'fast-glob'

export interface ValidationFinding {
  file: string
  line?: number
  message: string
}

export interface ValidationReport {
  valid: boolean
  recordCount: number
  findings: ValidationFinding[]
}

const recordTypes = ['entity', 'resource', 'assertion', 'evidence', 'provenance', 'assessment'] as const

export async function validateRepository(root = process.cwd()): Promise<ValidationReport> {
  const report: ValidationReport = { valid: true, recordCount: 0, findings: [] }
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const schemaDir = path.join(root, 'spec/v0.1/schemas/core')
  const validators = new Map<string, ReturnType<typeof ajv.compile>>()

  for (const recordType of recordTypes) {
    const raw = await readFile(path.join(schemaDir, `${recordType}.schema.json`), 'utf8')
    validators.set(recordType, ajv.compile(JSON.parse(raw)))
  }

  const files = await fg('datasets/**/*.jsonl', { cwd: root, absolute: true })
  const ids = new Map<string, string>()

  for (const file of files.sort()) {
    const text = await readFile(file, 'utf8')
    const lines = text.split(/\r?\n/)
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim()
      if (!line) continue
      report.recordCount++
      let record: Record<string, unknown>
      try {
        record = JSON.parse(line) as Record<string, unknown>
      } catch {
        report.findings.push({ file: path.relative(root, file), line: index + 1, message: 'Invalid JSON' })
        continue
      }

      const recordType = record.record_type
      if (typeof recordType !== 'string' || !validators.has(recordType)) {
        report.findings.push({ file: path.relative(root, file), line: index + 1, message: `Unknown record_type: ${String(recordType)}` })
        continue
      }

      const validate = validators.get(recordType)!
      if (!validate(record)) {
        report.findings.push({
          file: path.relative(root, file),
          line: index + 1,
          message: ajv.errorsText(validate.errors, { separator: '; ' })
        })
      }

      if (typeof record.id === 'string') {
        const previous = ids.get(record.id)
        if (previous) {
          report.findings.push({
            file: path.relative(root, file),
            line: index + 1,
            message: `Duplicate canonical id ${record.id}; first seen in ${previous}`
          })
        } else {
          ids.set(record.id, path.relative(root, file))
        }
      }
    }
  }

  report.valid = report.findings.length === 0
  return report
}

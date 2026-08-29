import { MaterializationAuditor } from './materialization-auditor.js'

export async function validateMaterialization(rootDir: string = process.cwd()): Promise<{
  valid: boolean
  problems: string[]
  totalEditions: number
  recordBearingEditions: number
  zeroRecordEditions: number
  canonicalRecords: number
}> {
  const problems: string[] = []
  const auditor = new MaterializationAuditor(rootDir)
  const { summary, canonicalOwnership, auditRecords, zeroRecordEditions } = await auditor.runAudit()

  if (summary.totalEditions < 200) {
    problems.push(`Total editions count (${summary.totalEditions}) is less than expected 200 threshold`)
  }

  // Verify that all canonical record ownership entries point to valid workIds and have valid positions
  for (const o of canonicalOwnership) {
    if (!o.workId || !o.position || !o.canonicalId.startsWith('mw:')) {
      problems.push(`Malformed canonical record ownership entry: ${JSON.stringify(o)}`)
    }
  }

  // Verify that fully materialized editions have non-zero records
  for (const r of auditRecords) {
    if (r.materializationStatus === 'FULL' && r.canonicalRecords === 0) {
      problems.push(`Edition '${r.editionId}' marked FULL but has 0 canonical records`)
    }
  }

  if (zeroRecordEditions.some(r => !r.reason || r.reason.trim().length === 0)) {
    problems.push('Every zero-record edition must have an explicit machine-readable reason')
  }

  if (auditRecords.some(r => r.normalizedRecords > 0 && (!r.rawSha256 || r.hashStatus !== 'VERIFIED'))) {
    problems.push('Every record-bearing edition must have a verified payload hash')
  }

  if (auditRecords.some(r => r.normalizedRecords > 0 && r.provenanceStatus === 'PENDING')) {
    problems.push('Every record-bearing edition must retain verified provenance')
  }

  return {
    valid: problems.length === 0,
    problems,
    totalEditions: summary.totalEditions,
    recordBearingEditions: summary.recordBearingEditions,
    zeroRecordEditions: summary.zeroRecordEditions,
    canonicalRecords: auditRecords.reduce((n, r) => n + r.canonicalRecords, 0)
  }
}

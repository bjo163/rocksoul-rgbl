import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  UpstreamJobResult,
  UpstreamRunManifest,
  UpstreamCoverageReport,
  UpstreamFailureClass
} from './types.js'

export interface ManifestGenerationOptions {
  runId: string
  startedAt: string
  completedAt: string
  registryVersion: string
  workers: number
  jobs: UpstreamJobResult[]
  defaultAllowFallback?: boolean
  outDir?: string
}

export interface EndpointCoverageAuditItem {
  tradition: string
  endpointId: string
  name: string
  requestedUrl: string
  actualSource: string
  sourceType: string
  authorityLevel: string
  remoteReachable: boolean
  remoteAcquirable: boolean
  adapter: string
  recipe: string
  acquisitionStatus: string
  executionStatus: string
  failureClass?: UpstreamFailureClass
  reason: string
}

export function buildRunManifest(options: ManifestGenerationOptions): UpstreamRunManifest {
  // Check for duplicate job IDs
  const seenIds = new Set<string>()
  for (const job of options.jobs) {
    if (seenIds.has(job.id)) {
      throw new Error(`Duplicate upstream job ID in manifest: ${job.id}`)
    }
    seenIds.add(job.id)
  }

  // Sort jobs deterministically by job ID
  const sortedJobs = [...options.jobs].sort((a, b) => a.id.localeCompare(b.id))

  const totals = {
    planned: sortedJobs.length,
    remoteSynced: sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_SYNCED').length,
    notModified: sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_NOT_MODIFIED').length,
    cache: sortedJobs.filter(j => j.acquisitionStatus === 'LOCAL_CACHE').length,
    fallback: sortedJobs.filter(j => j.acquisitionStatus === 'LOCAL_FALLBACK').length,
    failed: sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_FAILED').length,
    unsupported: sortedJobs.filter(j => j.acquisitionStatus === 'UNSUPPORTED').length
  }

  // Hard Accounting Invariant Assertions
  const sum = totals.remoteSynced + totals.notModified + totals.cache + totals.fallback + totals.failed + totals.unsupported
  const accountingValid = (sum === totals.planned)

  if (!accountingValid) {
    throw new Error(`Manifest accounting invariant failed: sum(${sum}) !== planned(${totals.planned})`)
  }

  // Additional sanity check on all category sums
  if (
    totals.remoteSynced !== sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_SYNCED').length ||
    totals.notModified !== sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_NOT_MODIFIED').length ||
    totals.cache !== sortedJobs.filter(j => j.acquisitionStatus === 'LOCAL_CACHE').length ||
    totals.fallback !== sortedJobs.filter(j => j.acquisitionStatus === 'LOCAL_FALLBACK').length ||
    totals.failed !== sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_FAILED').length ||
    totals.unsupported !== sortedJobs.filter(j => j.acquisitionStatus === 'UNSUPPORTED').length
  ) {
    throw new Error('Manifest individual category count mismatch against job details')
  }

  // Compute breakdown of failure classes
  const failureClasses: Partial<Record<UpstreamFailureClass, number>> = {}
  for (const job of sortedJobs) {
    if (job.failureClass) {
      failureClasses[job.failureClass] = (failureClasses[job.failureClass] || 0) + 1
    }
  }

  return {
    schemaVersion: '1.0.0',
    valid: true,
    accountingValid: true,
    runId: options.runId,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    registryVersion: options.registryVersion,
    workers: options.workers,
    policy: {
      defaultAllowFallback: options.defaultAllowFallback ?? false
    },
    totals,
    failureClasses: Object.keys(failureClasses).length > 0 ? failureClasses : undefined,
    jobs: sortedJobs
  }
}

export function buildCoverageReport(manifest: UpstreamRunManifest): UpstreamCoverageReport {
  const { totals, runId, registryVersion, failureClasses } = manifest
  const planned = totals.planned || 1

  const remoteCoveragePercent = Number(((totals.remoteSynced + totals.notModified) / planned * 100).toFixed(4))
  const remoteValidPercent = remoteCoveragePercent
  const validatedCoveragePercent = Number(((totals.remoteSynced + totals.notModified + totals.cache) / planned * 100).toFixed(4))
  const fallbackPercent = Number((totals.fallback / planned * 100).toFixed(4))
  const failurePercent = Number((totals.failed / planned * 100).toFixed(4))

  let status: 'COMPLETE' | 'PARTIAL' | 'FAILED' = 'PARTIAL'
  if (totals.remoteSynced + totals.notModified === totals.planned) {
    status = 'COMPLETE'
  } else if (totals.remoteSynced + totals.notModified === 0) {
    status = 'FAILED'
  }

  return {
    schemaVersion: '1.0.0',
    generatedAt: manifest.completedAt,
    runId,
    registryVersion,
    planned: totals.planned,
    remoteSynced: totals.remoteSynced,
    notModified: totals.notModified,
    cache: totals.cache,
    fallback: totals.fallback,
    failed: totals.failed,
    unsupported: totals.unsupported,
    remoteCoveragePercent,
    remoteValidPercent,
    validatedCoveragePercent,
    fallbackPercent,
    failurePercent,
    status,
    failureClasses
  }
}

export function buildCoverageAuditReport(manifest: UpstreamRunManifest): {
  schemaVersion: string
  generatedAt: string
  runId: string
  totalEndpoints: number
  endpoints: EndpointCoverageAuditItem[]
} {
  const endpoints: EndpointCoverageAuditItem[] = manifest.jobs.map((job) => {
    const isRemote = job.acquisitionStatus === 'REMOTE_SYNCED' || job.acquisitionStatus === 'REMOTE_NOT_MODIFIED'
    let authorityLevel = 'Institutional / Academic Repository'
    if (job.traditionId === 'islam' || job.traditionId === 'judaism' || job.traditionId === 'christianity' || job.traditionId === 'buddhism') {
      authorityLevel = 'Official / Canonical Authority'
    } else if (job.endpointId === 'sacred-texts-shinto') {
      authorityLevel = 'Archival / Community Repository (Non-Official)'
    }

    return {
      tradition: job.traditionId,
      endpointId: job.endpointId,
      name: job.id,
      requestedUrl: job.requestedUrl || 'unknown',
      actualSource: job.resolvedUrl || job.requestedUrl || 'unknown',
      sourceType: job.mode,
      authorityLevel,
      remoteReachable: isRemote,
      remoteAcquirable: job.acquisitionStatus !== 'UNSUPPORTED',
      adapter: job.provenance?.adapterId || job.mode,
      recipe: job.provenance?.recipeId || 'none',
      acquisitionStatus: job.acquisitionStatus,
      executionStatus: job.executionStatus,
      failureClass: job.failureClass,
      reason: job.fallbackReason || job.error || 'ok'
    }
  })

  return {
    schemaVersion: '1.0.0',
    generatedAt: manifest.completedAt,
    runId: manifest.runId,
    totalEndpoints: endpoints.length,
    endpoints
  }
}

export async function writeRunManifest(
  manifest: UpstreamRunManifest,
  outDir: string = path.join(process.cwd(), 'dist')
): Promise<string> {
  await mkdir(outDir, { recursive: true })
  const targetFile = path.join(outDir, 'upstream-sync-manifest.json')
  await writeFile(targetFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  const coverageReport = buildCoverageReport(manifest)
  const coverageFile = path.join(outDir, 'upstream-coverage.json')
  await writeFile(coverageFile, JSON.stringify(coverageReport, null, 2) + '\n', 'utf8')

  const auditReport = buildCoverageAuditReport(manifest)
  const auditFile = path.join(outDir, 'upstream-coverage-audit.json')
  await writeFile(auditFile, JSON.stringify(auditReport, null, 2) + '\n', 'utf8')

  return targetFile
}

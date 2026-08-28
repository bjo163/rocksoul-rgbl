import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { UpstreamJobResult, UpstreamRunManifest, UpstreamCoverageReport } from './types.js'

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

export function buildRunManifest(options: ManifestGenerationOptions): UpstreamRunManifest {
  // Sort jobs deterministically by job ID, not completion order
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

  // Task 1: Invariant Assertion
  const sum = totals.remoteSynced + totals.notModified + totals.cache + totals.fallback + totals.failed + totals.unsupported
  if (sum !== totals.planned) {
    throw new Error(`Manifest accounting invariant failed: sum(${sum}) !== planned(${totals.planned})`)
  }

  return {
    schemaVersion: '1.0.0',
    runId: options.runId,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    registryVersion: options.registryVersion,
    workers: options.workers,
    policy: {
      defaultAllowFallback: options.defaultAllowFallback ?? false
    },
    totals,
    jobs: sortedJobs
  }
}

export function buildCoverageReport(manifest: UpstreamRunManifest): UpstreamCoverageReport {
  const { totals, runId, registryVersion } = manifest
  const planned = totals.planned || 1

  const remoteCoveragePercent = Number(((totals.remoteSynced + totals.notModified) / planned * 100).toFixed(2))
  const validatedCoveragePercent = Number(((totals.remoteSynced + totals.notModified + totals.cache) / planned * 100).toFixed(2))
  const fallbackPercent = Number((totals.fallback / planned * 100).toFixed(2))
  const failurePercent = Number((totals.failed / planned * 100).toFixed(2))

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
    validatedCoveragePercent,
    fallbackPercent,
    failurePercent
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

  return targetFile
}

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { UpstreamJobResult, UpstreamRunManifest } from './types.js'

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
    failed: sortedJobs.filter(j => j.acquisitionStatus === 'REMOTE_FAILED' || j.status === 'failed').length,
    unsupported: sortedJobs.filter(j => j.acquisitionStatus === 'UNSUPPORTED' || j.status === 'unsupported').length
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

export async function writeRunManifest(
  manifest: UpstreamRunManifest,
  outDir: string = path.join(process.cwd(), 'dist')
): Promise<string> {
  await mkdir(outDir, { recursive: true })
  const targetFile = path.join(outDir, 'upstream-sync-manifest.json')
  await writeFile(targetFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  return targetFile
}

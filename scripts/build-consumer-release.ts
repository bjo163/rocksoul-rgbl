import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { copyFile, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { canonicalJson } from '@moonwitness/corpus-build'

interface ReleaseVersion {
  format: string
  version: string
  specVersion: string
}

interface Artifact {
  path: string
  sha256: string
  bytes: number
  records: number
  domains: Record<string, number>
}

async function countRecords(file: string): Promise<{ records: number; domains: Record<string, number> }> {
  const domains: Record<string, number> = {}
  let records = 0
  const input = (await import('node:fs')).createReadStream(file, { encoding: 'utf8' })
  const lines = readline.createInterface({ input, crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    const record = JSON.parse(line) as { record_type?: string; kind?: string }
    records += 1
    const domain = record.kind?.split('.')[0] ?? record.record_type ?? 'unknown'
    domains[domain] = (domains[domain] ?? 0) + 1
  }
  return { records, domains: Object.fromEntries(Object.entries(domains).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) }
}

export async function buildConsumerRelease(root = process.cwd()): Promise<void> {
  const release = JSON.parse(await readFile(path.join(root, 'release/corpus-release.json'), 'utf8')) as ReleaseVersion
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const sourceManifest = JSON.parse(await readFile(path.join(root, 'config/upstream-registry.json'), 'utf8')) as { registryVersion?: string }
  const sourceArtifact = path.join(root, 'dist/records.jsonl')
  const releaseDir = path.join(root, 'dist/release')
  const artifactName = `moonwitness-corpus-${release.version}.jsonl`
  const artifactPath = path.join(releaseDir, artifactName)
  await copyFile(sourceArtifact, artifactPath)
  const bytes = await readFile(artifactPath)
  const counts = await countRecords(artifactPath)
  const artifact: Artifact = {
    path: artifactName,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: (await stat(artifactPath)).size,
    records: counts.records,
    domains: counts.domains
  }
  const manifest = {
    format: 'moonwitness-consumer-release-v1',
    corpus: 'moonwitness-corpus',
    version: release.version,
    commit,
    schemaVersion: release.specVersion,
    sourceManifestVersion: sourceManifest.registryVersion ?? 'unknown',
    releaseManifest: 'release-manifest.json',
    artifact,
    distribution: {
      githubRepository: 'bjo163/moonwitness-corpus',
      githubReleaseTag: `corpus-v${release.version}`,
      githubReleaseAsset: artifactName
    },
    rights: {
      policy: 'Per-dataset rights and attribution metadata remain authoritative.',
      metadataSources: ['datasets/*/manifest.json', 'datasets/*/README.md', 'record provenance fields'],
      publicationGate: 'Repository-wide license and npm-scope authorization remain explicitly gated.'
    },
    consumption: {
      development: `Pin commit ${commit} and verify this manifest and artifact checksum.`,
      production: 'Use an immutable tagged GitHub Release asset; never use a floating branch.'
    }
  }
  await writeFile(path.join(releaseDir, `${artifactName}.manifest.json`), `${canonicalJson(manifest)}\n`)
  console.log(JSON.stringify({ version: release.version, commit, artifact }, null, 2))
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invoked && fileURLToPath(import.meta.url) === invoked) await buildConsumerRelease()

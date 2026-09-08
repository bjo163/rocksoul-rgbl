import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'

const root = process.cwd()
const releaseDir = path.join(root, 'dist/release')
const manifests = await (await import('node:fs/promises')).readdir(releaseDir)
const manifestName = manifests.find((name) => name.endsWith('.jsonl.manifest.json'))
if (!manifestName) throw new Error('Consumer release manifest not found')
const manifest = JSON.parse(await readFile(path.join(releaseDir, manifestName), 'utf8')) as {
  format: string
  artifact: { path: string; sha256: string; bytes: number; records: number; domains: Record<string, number> }
}
if (manifest.format !== 'moonwitness-consumer-release-v1') throw new Error('Unsupported consumer release manifest')
const artifactPath = path.join(releaseDir, manifest.artifact.path)
if (!existsSync(artifactPath)) throw new Error(`Missing consumer artifact: ${manifest.artifact.path}`)
const bytes = await readFile(artifactPath)
const sha256 = createHash('sha256').update(bytes).digest('hex')
if (sha256 !== manifest.artifact.sha256) throw new Error('Consumer artifact checksum mismatch')
if (bytes.byteLength !== manifest.artifact.bytes) throw new Error('Consumer artifact byte count mismatch')
let records = 0
const domains: Record<string, number> = {}
const lines = readline.createInterface({ input: (await import('node:fs')).createReadStream(artifactPath, { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of lines) {
  if (!line.trim()) continue
  const record = JSON.parse(line) as { kind?: string; record_type?: string }
  records += 1
  const domain = record.kind?.split('.')[0] ?? record.record_type ?? 'unknown'
  domains[domain] = (domains[domain] ?? 0) + 1
}
if (records !== manifest.artifact.records) throw new Error('Consumer artifact record count mismatch')
const sortedDomains = Object.fromEntries(Object.entries(domains).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
if (JSON.stringify(sortedDomains) !== JSON.stringify(manifest.artifact.domains)) throw new Error('Consumer artifact domain counts mismatch')
console.log(JSON.stringify({ artifact: manifest.artifact.path, records, sha256, verified: true }, null, 2))

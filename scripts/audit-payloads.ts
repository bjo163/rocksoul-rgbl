import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { METRIC_SEMANTICS_VERSION } from '../packages/ingestion/src/metrics/semantics.js'

const root = process.cwd()
const dir = path.join(root, 'dist/acquisition-payloads')
const files = existsSync(dir)
  ? (await readdir(dir)).filter((file) => file.endsWith('.bin')).sort()
  : []
const payloads: Array<{ payloadId: string; path: string; bytes: number; sha256: string }> = []
const invalidFiles: string[] = []

for (const name of files) {
  const bytes = await readFile(path.join(dir, name))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (name !== `${sha256}.bin`) {
    invalidFiles.push(name)
    continue
  }
  payloads.push({
    payloadId: `mw:payload:sha256:${sha256}`,
    path: path.relative(root, path.join(dir, name)).replaceAll(path.sep, '/'),
    bytes: bytes.byteLength,
    sha256
  })
}

const manifest = {
  schemaVersion: '1.0.0',
  metricSemanticsVersion: METRIC_SEMANTICS_VERSION,
  payloads,
  invalidFiles
}
await mkdir(path.join(root, 'dist'), { recursive: true })
await writeFile(path.join(root, 'dist/payload-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({
  count: payloads.length,
  bytes: payloads.reduce((total, payload) => total + payload.bytes, 0),
  invalidFiles,
  verified: true
}, null, 2))

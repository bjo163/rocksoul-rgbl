import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { CLASSIFICATION_MODEL_VERSION, METRIC_SEMANTICS_VERSION } from '../packages/ingestion/src/metrics/semantics.js'

const root = process.cwd()
const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(file, 'utf8')) as T
const payloadManifestPath = path.join(root, 'dist/payload-manifest.json')
const endpointAuditPath = path.join(root, 'dist/phase23-endpoint-audit.json')
if (!existsSync(payloadManifestPath)) throw new Error('Missing dist/payload-manifest.json')
if (!existsSync(endpointAuditPath)) throw new Error('Missing dist/phase23-endpoint-audit.json')

const payloadManifest = await readJson<{
  metricSemanticsVersion: string
  payloads: Array<{ path: string; bytes: number; sha256: string }>
}>(payloadManifestPath)
if (payloadManifest.metricSemanticsVersion !== METRIC_SEMANTICS_VERSION) throw new Error('Payload manifest metric semantics version mismatch')
for (const payload of payloadManifest.payloads) {
  const file = path.join(root, payload.path)
  if (!existsSync(file)) throw new Error(`Missing retained payload: ${payload.path}`)
  const bytes = await readFile(file)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== payload.sha256 || bytes.byteLength !== payload.bytes || path.basename(file) !== `${sha256}.bin`) {
    throw new Error(`Retained payload verification failed: ${payload.path}`)
  }
}

const audit = await readJson<{
  classificationModelVersion: string
  metricSemanticsVersion: string
  inventory: Array<{ association: string; measurementState: string }>
  summary: { registered: number; endpointConfirmed: number; endpointAmbiguous: number; endpointMissing: number; measured: number; unmeasurable: number }
}>(endpointAuditPath)
if (audit.classificationModelVersion !== CLASSIFICATION_MODEL_VERSION) throw new Error('Endpoint classification model version mismatch')
if (audit.metricSemanticsVersion !== METRIC_SEMANTICS_VERSION) throw new Error('Endpoint metric semantics version mismatch')
const { summary, inventory } = audit
if (summary.registered !== inventory.length) throw new Error('Endpoint audit registered count mismatch')
if (summary.endpointConfirmed + summary.endpointAmbiguous + summary.endpointMissing > summary.registered) throw new Error('Endpoint association totals exceed registered editions')
if (summary.measured + summary.unmeasurable !== summary.registered) throw new Error('Endpoint measurement totals mismatch')

console.log(JSON.stringify({
  payloadsVerified: payloadManifest.payloads.length,
  endpointEditionsVerified: inventory.length,
  classificationModelVersion: audit.classificationModelVersion,
  metricSemanticsVersion: audit.metricSemanticsVersion,
  verified: true
}, null, 2))

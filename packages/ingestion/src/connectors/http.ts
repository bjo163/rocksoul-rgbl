import type { AcquisitionResult, HttpAcquisition } from '../types.js'
import { verifyPinnedBytes } from '../checksum.js'

export async function acquireHttp(
  source: HttpAcquisition,
  options: { allowNetwork?: boolean; fetchImpl?: typeof fetch } = {}
): Promise<AcquisitionResult> {
  if (!options.allowNetwork) throw new Error('HTTP acquisition requires explicit allowNetwork=true for an ingestion job')
  const url = new URL(source.url)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('HTTP acquisition only supports http: and https: URLs')
  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(url, { method: 'GET', redirect: 'follow' })
  if (!response.ok) throw new Error(`HTTP acquisition failed with ${response.status} ${response.statusText}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const sha256 = verifyPinnedBytes(bytes, source.sha256, source.byte_size)
  return {
    bytes,
    source,
    resolved_location: response.url || url.toString(),
    retrieved_at: new Date().toISOString(),
    sha256
  }
}

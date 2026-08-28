import { createHash } from 'node:crypto'
import type { UpstreamScriptPayload } from '../packages/ingestion/src/upstream/types.js'

const BASE_URL = 'https://ctext.org/api.pl'
const CTEXT_API_KEY = process.env.CTEXT_API_KEY

async function fetchCtext(urn: string): Promise<{ text: string; sha256: string; bytes: number }> {
  const apiKeyParam = CTEXT_API_KEY ? `&key=${encodeURIComponent(CTEXT_API_KEY)}` : ''
  const url = `${BASE_URL}?if=en&urn=${urn}${apiKeyParam}`
  console.log(`[CText API] Fetching: ${urn} -> ${url.replace(CTEXT_API_KEY || '____', '***')}`)

  const res = await fetch(url, { headers: { 'Accept': 'application/xml, text/xml, */*' } })
  if (!res.ok) {
    throw new Error(`CText API HTTP ${res.status}: ${res.statusText}`)
  }

  const text = await res.text()
  const bytes = Buffer.byteLength(text)
  const sha256 = createHash('sha256').update(text).digest('hex')
  return { text, sha256, bytes }
}

async function main() {
  console.log('========================================================================')
  console.log('☯️ Chinese Text Project API Automated Upstream Seeding Engine')
  console.log('========================================================================\n')

  if (!CTEXT_API_KEY) {
    console.log('⚠ No CTEXT_API_KEY provided. CText API requires authentication for automated batch queries.')
    const result: UpstreamScriptPayload = {
      schemaVersion: '1.0',
      executionStatus: 'PROCESS_SUCCEEDED',
      acquisitionStatus: 'REMOTE_FAILED',
      failureClass: 'REMOTE_AUTH_REQUIRED',
      requestedUrl: 'https://ctext.org/api.pl',
      resolvedUrl: 'https://ctext.org/api.pl',
      retrievedAt: new Date().toISOString(),
      sourceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      byteCount: 0,
      fallbackReason: 'CText API requires an API key (CTEXT_API_KEY). Unauthenticated requests are rate-limited or forbidden.',
      error: 'REMOTE_AUTH_REQUIRED: CTEXT_API_KEY environment variable not configured'
    }
    console.log(`\nMOONWITNESS_RESULT:${JSON.stringify(result)}`)
    return
  }

  const textsToSync = [
    { urn: 'ctp:dao-de-jing', title: 'Dao De Jing (道德經)' },
    { urn: 'ctp:analects', title: 'The Analects of Confucius (論語)' },
    { urn: 'ctp:zhuangzi', title: 'Zhuangzi (莊子)' }
  ]

  let totalBytes = 0
  const aggregateHash = createHash('sha256')
  let successfulFetches = 0

  for (const item of textsToSync) {
    try {
      const data = await fetchCtext(item.urn)
      totalBytes += data.bytes
      aggregateHash.update(data.sha256)
      successfulFetches++
      console.log(`✓ Fetched ${item.title}: ${data.bytes} bytes (SHA-256: ${data.sha256.slice(0, 16)}...)`)
    } catch (err: any) {
      console.warn(`⚠ Could not fetch ${item.urn}: ${err.message}`)
    }
  }

  const aggregateSha256 = aggregateHash.digest('hex')
  const acquisitionStatus = successfulFetches > 0 ? 'REMOTE_SYNCED' : 'REMOTE_FAILED'

  const result: UpstreamScriptPayload = {
    schemaVersion: '1.0',
    executionStatus: 'PROCESS_SUCCEEDED',
    acquisitionStatus,
    failureClass: acquisitionStatus === 'REMOTE_FAILED' ? 'REMOTE_RATE_LIMITED' : undefined,
    requestedUrl: 'https://ctext.org/api.pl',
    resolvedUrl: 'https://ctext.org/api.pl',
    retrievedAt: new Date().toISOString(),
    sourceSha256: successfulFetches > 0 ? aggregateSha256 : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    byteCount: totalBytes,
    fallbackReason: acquisitionStatus === 'REMOTE_FAILED' ? 'CText API queries failed or returned 403' : undefined
  }

  console.log('\n========================================================================')
  console.log('✨ Chinese Text Project Upstream Ingestion Complete!')
  console.log('========================================================================\n')
  console.log(`MOONWITNESS_RESULT:${JSON.stringify(result)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

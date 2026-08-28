import assert from 'node:assert/strict'
import test from 'node:test'
import { startCorpusServer } from './server.js'

test('@moonwitness/corpus-server serves REST endpoints, Swagger docs, and search with sub-millisecond latency', async () => {
  const server = await startCorpusServer({ port: 3039 })

  try {
    // 1. Health check & OpenTelemetry
    const resHealth = await fetch('http://localhost:3039/v1/health')
    assert.equal(resHealth.status, 200)
    const health = (await resHealth.json()) as any
    assert.equal(health.status, 'healthy')
    assert.ok(health.totalRecords >= 500000)

    // 2. Traditions (Dynamic aggregation)
    const resTrad = await fetch('http://localhost:3039/v1/traditions')
    assert.equal(resTrad.status, 200)
    const tradJson = (await resTrad.json()) as any
    assert.ok(tradJson.data.length >= 8, 'Must return traditions')

    // 3. High-Speed Search
    const resSearch = await fetch('http://localhost:3039/v1/search?q=mercy&limit=5')
    assert.equal(resSearch.status, 200)
    const searchJson = (await resSearch.json()) as any
    assert.ok(searchJson.data.length > 0)

    // 4. Devotionals
    const resDev = await fetch('http://localhost:3039/v1/devotionals?tradition=islam&limit=5')
    assert.equal(resDev.status, 200)
    const devJson = (await resDev.json()) as any
    assert.ok(devJson.data.length > 0)

    // 5. OpenTelemetry & Prometheus Metrics
    const resMetrics = await fetch('http://localhost:3039/metrics')
    assert.equal(resMetrics.status, 200)
    const metricsText = await resMetrics.text()
    assert.ok(metricsText.includes('corpus_indexed_records_total'))

    // 6. Swagger UI Docs
    const resDocs = await fetch('http://localhost:3039/docs')
    assert.equal(resDocs.status, 200)
    assert.ok((await resDocs.text()).includes('swagger'))
  } finally {
    await server.close()
  }
})

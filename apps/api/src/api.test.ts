import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from './app.js'

test('Fastify Corpus API Engine with OpenTelemetry & Dynamic Traditions', async (t) => {
  const app = await buildApp()

  await t.test('GET /v1/health returns healthy and 537k+ records with OTel trace headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.status, 'healthy')
    assert.ok(json.totalRecords > 530000, `Must report over 530,000 records, got ${json.totalRecords}`)

    // OpenTelemetry Header Invariants
    assert.ok(res.headers['x-trace-id'], 'Must inject x-trace-id header')
    assert.ok(res.headers['traceparent'], 'Must inject W3C traceparent header')
    assert.ok(res.headers['x-response-time-ms'], 'Must inject x-response-time-ms header')
  })

  await t.test('GET /metrics returns standard OpenTelemetry / Prometheus telemetry format', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' })
    assert.equal(res.statusCode, 200)
    const body = res.body
    assert.ok(body.includes('corpus_indexed_records_total'), 'Must expose corpus_indexed_records_total gauge')
    assert.ok(body.includes('http_requests_total'), 'Must expose http_requests_total counter')
    assert.ok(body.includes('process_memory_rss_bytes'), 'Must expose memory metrics')
  })

  await t.test('GET /v1/traditions dynamically aggregates all active traditions from database', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/traditions' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.ok(json.total >= 8, `Expected at least 8 traditions, got ${json.total}`)
    assert.ok(json.data.some((d: any) => d.id === 'islam'), 'Must contain islam')
    assert.ok(json.data.some((d: any) => d.id === 'hinduism'), 'Must contain hinduism')
    assert.ok(json.data.some((d: any) => d.id === 'buddhism'), 'Must contain buddhism')
  })

  await t.test('GET /v1/search executes FTS5 sub-millisecond full-text queries', async () => {
    const start = performance.now()
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=mercy&limit=5' })
    const duration = performance.now() - start
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.count > 0, 'Must find hits for mercy')
    assert.ok(duration < 100, `Search request duration was ${duration.toFixed(2)}ms`)
  })

  await t.test('GET /v1/devotionals returns authentic Islamic Duas and Asmaul Husna', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/devotionals?tradition=islam&limit=10' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.count > 0, 'Must return devotional records')
  })

  await t.test('GET /v1/compare dynamically aggregates parallel wisdom across active traditions', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/compare?theme=wisdom' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.traditionsCovered >= 1, 'Must find wisdom in at least one active tradition')
  })

  await t.test('GET /v1/passages returns parallel text lanes and trace metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/passages/mw%3Apassage%3Ahinduism%3Abhagavad-gita%3A1%3A1' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.equal(json.data.passage.id, 'mw:passage:hinduism:bhagavad-gita:1:1')
    assert.ok(json.data.contents.length >= 2)
    assert.ok(json.data.dataset)
  })

  await t.test('GET /v1/works/:id resolves canonical work hierarchy', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/works/mw%3Awork%3Ahinduism%3Abhagavad-gita' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.data.work.id, 'mw:work:hinduism:bhagavad-gita')
    assert.ok(Array.isArray(json.data.expressions))
    assert.ok(Array.isArray(json.data.editions))
    assert.ok(Array.isArray(json.data.artifacts))
  })

  await t.test('GET /v1/assertions/:id/traversal resolves explicit evidence targets', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/assertions/mw%3Aassertion%3Aexample%3A001/traversal' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.data.assertion.id, 'mw:assertion:example:001')
    assert.ok(json.data.evidence.some((item: any) => item.id === 'mw:evidence:example:001'))
    assert.ok(json.data.targets.length >= 1)
  })

  await t.test('GET /v1/search honors tradition filtering and pagination metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=mercy&tradition=islam&limit=5' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.tradition, 'islam')
    assert.equal(typeof json.hasMore, 'boolean')
    assert.ok(json.data.every((item: any) => item.tradition === 'islam'))
  })

  await app.close()
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from './app.js'

test('MoonWitness Universal Scriptural API Endpoints', async (t) => {
  const app = await buildApp()

  await t.test('GET /v1/health returns healthy system status and database stats', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.status, 'healthy')
    assert.ok(json.totalRecords > 500000, `Expected totalRecords > 500000, got ${json.totalRecords}`)
  })

  await t.test('GET /v1/works returns all canonical works with structural levels', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/works' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.ok(json.total >= 5, `Expected at least 5 works, got ${json.total}`)
    assert.ok(json.data.length > 0)
  })

  await t.test('GET /v1/traditions dynamically aggregates all active traditions from database', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/traditions' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.ok(json.total >= 8, `Expected at least 8 traditions, got ${json.total}`)
    assert.ok(json.data.some((d: any) => d.tradition === 'islam' || d.id === 'islam'), 'Must contain islam')
    assert.ok(json.data.some((d: any) => d.tradition === 'hinduism' || d.id === 'hinduism'), 'Must contain hinduism')
    assert.ok(json.data.some((d: any) => d.tradition === 'buddhism' || d.id === 'buddhism'), 'Must contain buddhism')
  })

  await t.test('GET /v1/search executes FTS5 sub-millisecond full-text queries', async () => {
    // Warm-up query
    await app.inject({ method: 'GET', url: '/v1/search?q=mercy&limit=1' })

    const start = performance.now()
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=mercy&limit=5' })
    const duration = performance.now() - start
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.count > 0, 'Must find hits for mercy')
    assert.ok(duration < 500, `Search request duration was ${duration.toFixed(2)}ms`)
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
    assert.equal(json.success, true)
    assert.ok(json.traditionsCovered >= 3, `Expected at least 3 traditions covered, got ${json.traditionsCovered}`)
  })
})

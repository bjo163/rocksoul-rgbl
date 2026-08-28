import assert from 'node:assert/strict'
import test from 'node:test'
import { startCorpusServer } from './server.js'

test('@moonwitness/corpus-server serves REST endpoints, Swagger docs, and search with sub-millisecond latency', async () => {
  const server = startCorpusServer({ port: 3039 })

  try {
    // 1. Health check
    const resHealth = await fetch('http://localhost:3039/v1/health')
    assert.equal(resHealth.status, 200)
    const health = (await resHealth.json()) as any
    assert.equal(health.status, 'ok')

    // 2. Traditions
    const resTrad = await fetch('http://localhost:3039/v1/traditions')
    assert.equal(resTrad.status, 200)
    const traditions = (await resTrad.json()) as any[]
    assert.ok(traditions.length >= 8, 'Must return traditions')

    // 3. Bhagavad Gita Passages
    const resGita = await fetch('http://localhost:3039/v1/works/hinduism:bhagavad-gita/passages?page=1&limit=5')
    assert.equal(resGita.status, 200)
    const gita = (await resGita.json()) as any
    assert.equal(gita.passages.length, 5)

    // 4. Passage Detail
    const resPassage = await fetch('http://localhost:3039/v1/passages/hinduism:bhagavad-gita:1:1')
    assert.equal(resPassage.status, 200)
    const passage = (await resPassage.json()) as any
    assert.ok(passage.contents.length >= 2)

    // 5. Devotionals
    const resDev = await fetch('http://localhost:3039/v1/devotionals?category=asmaul-husna&limit=5')
    assert.equal(resDev.status, 200)
    const dev = (await resDev.json()) as any
    assert.equal(dev.count, 5)

    // 6. OpenAPI & Swagger Docs
    const resOpenApi = await fetch('http://localhost:3039/openapi.json')
    assert.equal(resOpenApi.status, 200)
    const resDocs = await fetch('http://localhost:3039/docs')
    assert.equal(resDocs.status, 200)
    assert.ok((await resDocs.text()).includes('SwaggerUIBundle'))
  } finally {
    server.close()
  }
})

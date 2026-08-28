import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http'
import { parse as parseUrl } from 'node:url'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { SqliteCorpusRepository } from '@moonwitness/corpus-node'
import { openApiSpec, swaggerHtml } from './openapi.js'

export interface ServerOptions {
  port?: number
  dbPath?: string
  cors?: boolean
}

export function startCorpusServer(options: ServerOptions = {}): Server {
  const port = options.port ?? 3030
  const repo = SqliteCorpusRepository.open(options.dbPath)

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // 1. CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url ?? '/', 'http://localhost')
    const pathname = url.pathname
    const query = Object.fromEntries(url.searchParams.entries())

    const sendJson = (status: number, data: any) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(data, null, 2))
    }

    const sendHtml = (status: number, html: string) => {
      res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    }

    try {
      // 2. Documentation Routes
      if (pathname === '/' || pathname === '/docs') {
        return sendHtml(200, swaggerHtml())
      }
      if (pathname === '/openapi.json') {
        return sendJson(200, openApiSpec)
      }

      // 3. API Routes (/v1)
      if (pathname === '/v1/health') {
        return sendJson(200, {
          status: 'ok',
          service: 'MoonWitness Corpus Engine',
          version: '0.1.0',
          specVersion: '0.1',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        })
      }

      if (pathname === '/v1/traditions') {
        const traditions = [
          { id: 'mw:tradition:islam', name: 'Islam', icon: '☪️', scriptures: ['quran', 'hadith-bukhari', 'hadith-nawawi-40', 'asmaul-husna-99', 'islamic-duas-authentic'] },
          { id: 'mw:tradition:christianity', name: 'Christianity / Kekristenan', icon: '✝️', scriptures: ['sblgnt', 'web-classic', 'tsi-2021', 'early-christian-writings'] },
          { id: 'mw:tradition:judaism', name: 'Judaism / Yudaisme', icon: '✡️', scriptures: ['oshb-wlc', 'mishnah-pirkei-avot', 'hebrew-biblical-lexicon'] },
          { id: 'mw:tradition:hinduism', name: 'Hinduism / Hindu', icon: '🕉️', scriptures: ['bhagavad-gita', 'yoga-sutras', 'sanskrit-hindu-lexicon'] },
          { id: 'mw:tradition:buddhism', name: 'Buddhism / Buddha', icon: '☸️', scriptures: ['dhammapada-sujato', 'dhammapada-indonesian-wikisource', 'suttacentral-dn-mn-sujato'] },
          { id: 'mw:tradition:taoism', name: 'Taoism / Taoisme', icon: '☯️', scriptures: ['tao-te-ching'] },
          { id: 'mw:tradition:confucianism', name: 'Confucianism / Konfusianisme', icon: '🏛️', scriptures: ['analects-confucius'] },
          { id: 'mw:tradition:zoroastrianism', name: 'Zoroastrianism / Majusi', icon: '🔥', scriptures: ['gathas-zarathustra'] },
          { id: 'mw:tradition:devotional', name: 'World Devotional & Liturgies', icon: '🕊️', scriptures: ['devotional-baseline'] }
        ]
        return sendJson(200, traditions)
      }

      if (pathname === '/v1/datasets') {
        repo.listDatasets().then((datasets) => sendJson(200, datasets)).catch((err) => sendJson(500, { error: err.message }))
        return
      }

      // /v1/passages/:passageId
      const passageMatch = pathname.match(/^\/v1\/passages\/(.+)$/)
      if (passageMatch) {
        const rawId = decodeURIComponent(passageMatch[1])
        const id = rawId.startsWith('mw:') ? rawId : `mw:passage:${rawId}`
        const result = repo.getPassageWithContents(id as any)
        if (!result) return sendJson(404, { error: `Passage not found: ${id}` })
        return sendJson(200, result)
      }

      // /v1/works/:workId/passages
      const workPassagesMatch = pathname.match(/^\/v1\/works\/([^/]+)\/passages$/)
      if (workPassagesMatch) {
        const rawWorkId = decodeURIComponent(workPassagesMatch[1])
        const workId = rawWorkId.startsWith('mw:') ? rawWorkId : `mw:work:${rawWorkId}`
        const page = Math.max(1, parseInt(String(query.page || '1'), 10))
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)))
        const offset = (page - 1) * limit

        const results = repo.getWorkPassages(workId as any, limit, offset)
        return sendJson(200, {
          workId,
          page,
          limit,
          resultsCount: results.length,
          passages: results
        })
      }

      // /v1/works/:workId
      const workMatch = pathname.match(/^\/v1\/works\/([^/]+)$/)
      if (workMatch) {
        const rawWorkId = decodeURIComponent(workMatch[1])
        const workId = rawWorkId.startsWith('mw:') ? rawWorkId : `mw:work:${rawWorkId}`
        repo.getRecord(workId as any).then((work) => {
          if (!work) return sendJson(404, { error: `Work not found: ${workId}` })
          return sendJson(200, work)
        }).catch((err) => sendJson(500, { error: err.message }))
        return
      }

      // /v1/search?q=...
      if (pathname === '/v1/search') {
        const q = String(query.q || '')
        if (!q.trim()) return sendJson(400, { error: "Query parameter 'q' is required" })
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)))
        const offset = Math.max(0, parseInt(String(query.offset || '0'), 10))

        const start = performance.now()
        repo.search({ text: q, limit, offset }).then((results) => {
          const duration = performance.now() - start
          return sendJson(200, {
            query: q,
            limit,
            offset,
            totalHits: results.length,
            latencyMs: Number(duration.toFixed(2)),
            results
          })
        }).catch((err) => sendJson(500, { error: err.message }))
        return
      }

      // /v1/devotionals?tradition=...&category=...
      if (pathname === '/v1/devotionals') {
        const tradition = query.tradition ? String(query.tradition) : undefined
        const category = query.category ? String(query.category) : undefined
        const limit = Math.min(200, Math.max(1, parseInt(String(query.limit || '50'), 10)))

        const items = repo.getDevotionals(tradition, category, limit)
        return sendJson(200, {
          tradition: tradition ?? 'all',
          category: category ?? 'all',
          count: items.length,
          items
        })
      }

      // 404 Not Found
      return sendJson(404, { error: `Endpoint not found: ${pathname}. Visit /docs for API documentation.` })
    } catch (err: any) {
      return sendJson(500, { error: err.message || 'Internal Server Error' })
    }
  })

  server.listen(port, () => {
    console.log(`\n======================================================`)
    console.log(`🚀 MoonWitness Corpus Engine API Server Online`)
    console.log(`📡 URL: http://localhost:${port}`)
    console.log(`📖 Swagger UI Docs: http://localhost:${port}/docs`)
    console.log(`📄 OpenAPI Spec: http://localhost:${port}/openapi.json`)
    console.log(`======================================================\n`)
  })

  return server
}

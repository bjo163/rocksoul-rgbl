import fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'node:path'
import { SqliteCorpusRepository } from '@moonwitness/corpus-node'

import { telemetryPlugin } from './plugins/telemetry.js'
import { healthRoutes } from './modules/health/health.routes.js'
import { traditionsRoutes } from './modules/traditions/traditions.routes.js'
import { worksRoutes } from './modules/works/works.routes.js'
import { searchRoutes } from './modules/search/search.routes.js'
import { devotionalsRoutes } from './modules/devotionals/devotionals.routes.js'
import { compareRoutes } from './modules/compare/compare.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: process.env.LOG_LEVEL || 'info' }
  })

  // 1. Core Plugins & OpenTelemetry Tracing
  await app.register(cors, { origin: '*' })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })
  await app.register(telemetryPlugin)

  // 2. Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'MoonWitness Universal Corpus REST API',
        description: 'Ultra-fast, modular REST API microservice serving 537,000+ canonical sacred scriptures, FTS5 search, and comparative wisdom across 12 world religions.',
        version: '0.1.0'
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development Engine' }
      ]
    }
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  })

  // 3. Database & Repository
  const dbPath = path.resolve(process.cwd(), 'dist/corpus.sqlite')
  const repo = new SqliteCorpusRepository(dbPath)
  app.decorate('repo', repo)
  app.addHook('onClose', async () => {
    repo.close()
  })

  // 4. API Modules (Mounted under /v1)
  await app.register(async (v1) => {
    await v1.register(healthRoutes)
    await v1.register(traditionsRoutes)
    await v1.register(worksRoutes)
    await v1.register(searchRoutes)
    await v1.register(devotionalsRoutes)
    await v1.register(compareRoutes)
  }, { prefix: '/v1' })

  // Root redirect to docs
  app.get('/', async (req, reply) => {
    return reply.redirect('/docs')
  })

  return app
}

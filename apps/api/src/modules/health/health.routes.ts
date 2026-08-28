import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      tags: ['System'],
      summary: 'Corpus Engine Health & Telemetry',
      description: 'Returns operational status, memory metrics, and total indexed records in the embedded database.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            version: { type: 'string' },
            uptime: { type: 'number' },
            totalRecords: { type: 'number' },
            database: { type: 'string' },
            memoryUsageMb: { type: 'number' }
          }
        }
      }
    }
  }, async () => {
    const stats = fastify.repo.getStats()
    const mem = process.memoryUsage().rss / (1024 * 1024)

    return {
      status: 'healthy',
      service: '@moonwitness/corpus-api',
      version: '0.1.0',
      uptime: process.uptime(),
      totalRecords: stats.totalRecords,
      database: 'SQLite 3 with FTS5 Full-Text Indexing',
      memoryUsageMb: Number(mem.toFixed(2))
    }
  })
}

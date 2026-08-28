import type { FastifyPluginAsync } from 'fastify'

export const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/search', {
    schema: {
      tags: ['Search & FTS5'],
      summary: 'High-Speed Full-Text Search',
      description: 'Executes sub-millisecond full-text search against 537,000+ indexed sacred records with tradition and language filters.',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search term or keywords' },
          text: { type: 'string', description: 'Alias for q' },
          tradition: { type: 'string', description: 'Filter by tradition (islam, christianity, etc.)' },
          limit: { type: 'number', default: 20 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (req) => {
    const query = req.query as { q?: string; text?: string; tradition?: string; limit?: number; offset?: number }
    const searchTerm = query.q || query.text || ''
    const limit = query.limit || 20
    const offset = query.offset || 0

    if (!searchTerm) {
      return { success: true, count: 0, data: [] }
    }

    const start = performance.now()
    const results = await fastify.repo.search({
      text: searchTerm,
      tradition: query.tradition,
      limit,
      offset
    })
    const latencyMs = (performance.now() - start).toFixed(2)

    return {
      success: true,
      query: searchTerm,
      tradition: query.tradition ?? null,
      latencyMs: Number(latencyMs),
      count: results.length,
      data: results
    }
  })
}

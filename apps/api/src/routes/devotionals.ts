import type { FastifyPluginAsync } from 'fastify'

export const devotionalsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/devotionals', {
    schema: {
      tags: ['Devotionals & Prayers'],
      summary: 'Get Devotional Records & Prayers',
      description: 'Returns authentic supplications, Asmaul Husna, and sacred invocations across traditions.',
      querystring: {
        type: 'object',
        properties: {
          tradition: { type: 'string', default: 'islam' },
          category: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (req) => {
    const { tradition = 'islam', category, limit = 50, offset = 0 } = req.query as {
      tradition?: string
      category?: string
      limit?: number
      offset?: number
    }
    const items = fastify.repo.getDevotionals(tradition, category, Math.max(1, Math.min(100, limit)), Math.max(0, offset))

    return {
      success: true,
      tradition,
      category: category ?? 'all',
      limit,
      offset,
      count: items.length,
      data: items
    }
  })
}

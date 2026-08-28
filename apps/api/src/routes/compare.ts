import type { FastifyPluginAsync } from 'fastify'

export const compareRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/compare', {
    schema: {
      tags: ['Comparative Scriptures'],
      summary: 'Thematic Cross-Tradition Comparison',
      description: 'Finds parallel wisdom and related passages on key themes (wisdom, peace, justice, devotion, mercy) across world scriptures.',
      querystring: {
        type: 'object',
        properties: {
          theme: { type: 'string', default: 'mercy', description: 'Theme keyword (e.g. mercy, wisdom, action, righteousness)' },
          limit: { type: 'number', default: 3 }
        }
      }
    }
  }, async (req) => {
    const { theme = 'mercy', limit = 3 } = req.query as { theme?: string; limit?: number }

    const activeTraditions = fastify.repo.getTraditions().map((t: { tradition: string }) => t.tradition)
    const results: Record<string, any[]> = {}

    for (const t of activeTraditions) {
      const hits = await fastify.repo.search({ text: theme, tradition: t, limit })
      if (hits.length > 0) {
        results[t] = hits
      }
    }

    return {
      success: true,
      theme,
      traditionsCovered: Object.keys(results).length,
      data: results
    }
  })
}

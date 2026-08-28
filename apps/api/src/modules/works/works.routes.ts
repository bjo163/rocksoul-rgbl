import type { FastifyPluginAsync } from 'fastify'
import type { CanonicalId } from '@moonwitness/corpus-core'

export const worksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/works', {
    schema: {
      tags: ['Works & Scriptures'],
      summary: 'List Canonical Works',
      description: 'Returns all major sacred works and scriptures available in the corpus.',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            total: { type: 'number' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } }
          }
        }
      }
    }
  }, async () => {
    const works = fastify.repo.getWorks()
    return {
      success: true,
      total: works.length,
      data: works
    }
  })

  fastify.get('/works/:id/passages', {
    schema: {
      tags: ['Works & Scriptures'],
      summary: 'Get Passages for a Work',
      description: 'Fetches paginated passages and slokas/verses for a given work ID.',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (req) => {
    const { id } = req.params as { id: string }
    const { limit = 20, offset = 0 } = req.query as { limit?: number; offset?: number }

    const workId = (id.startsWith('mw:work:') ? id : `mw:work:${id}`) as CanonicalId
    const passages = fastify.repo.getWorkPassages(workId, limit, offset)

    return {
      success: true,
      workId,
      limit,
      offset,
      count: passages.length,
      data: passages
    }
  })
}

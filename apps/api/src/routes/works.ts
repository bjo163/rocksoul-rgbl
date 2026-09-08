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

  fastify.get('/works/:id', {
    schema: {
      tags: ['Works & Scriptures'],
      summary: 'Get Canonical Work Hierarchy',
      description: 'Returns a canonical work with its expressions, editions, artifacts, dataset and rights metadata.',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const workId = (id.startsWith('mw:work:') ? id : `mw:work:${id}`) as CanonicalId
    const hierarchy = await fastify.repo.getWorkHierarchy(workId)
    if (!hierarchy.work) return reply.code(404).send({ success: false, error: 'work_not_found', workId })
    return { success: true, data: hierarchy }
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
    const rawQuery = req.query as { limit?: number; offset?: number }
    const limit = Math.max(1, Math.min(100, rawQuery.limit ?? 20))
    const offset = Math.max(0, rawQuery.offset ?? 0)

    const workId = (id.startsWith('mw:work:') ? id : `mw:work:${id}`) as CanonicalId
    const page = fastify.repo.getWorkPassages(workId, limit + 1, offset)
    const total = fastify.repo.countWorkPassages(workId)
    const hasMore = page.length > limit
    const passages = page.slice(0, limit)

    return {
      success: true,
      workId,
      limit,
      offset,
      total,
      count: passages.length,
      hasMore,
      data: passages
    }
  })
}

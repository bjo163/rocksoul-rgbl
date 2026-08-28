import type { FastifyPluginAsync } from 'fastify'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function getUpstreamMetadata(): Promise<Record<string, any>> {
  try {
    const filePath = path.join(process.cwd(), 'config/upstream-registry.json')
    const raw = JSON.parse(await readFile(filePath, 'utf8'))
    return raw.traditions || {}
  } catch {
    return {}
  }
}

export const traditionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/traditions', {
    schema: {
      tags: ['Traditions'],
      summary: 'List All Dynamic Active Traditions',
      description: 'Dynamically aggregates all sacred traditions active in the corpus database along with their dataset counts, language, and scripture records.',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            total: { type: 'number' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  datasetCount: { type: 'number' },
                  totalRecords: { type: 'number' },
                  primaryLanguage: { type: 'string' },
                  scripts: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  }, async () => {
    const dbTraditions = fastify.repo.getTraditions()
    const metadata = await getUpstreamMetadata()

    const list = dbTraditions.map((t) => {
      const meta = metadata[t.tradition] || {}
      return {
        id: t.tradition,
        name: meta.name || t.tradition.charAt(0).toUpperCase() + t.tradition.slice(1),
        datasetCount: t.dataset_count,
        totalRecords: t.total_records || 0,
        primaryLanguage: meta.primaryLanguage || 'und',
        scripts: meta.scripts || []
      }
    })

    return {
      success: true,
      total: list.length,
      data: list
    }
  })
}

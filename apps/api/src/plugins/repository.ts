import { SqliteCorpusRepository } from '@moonwitness/corpus-node'
import type { FastifyPluginAsync } from 'fastify'
import path from 'node:path'

declare module 'fastify' {
  interface FastifyInstance {
    repo: SqliteCorpusRepository
  }
}

export const repositoryPlugin: FastifyPluginAsync = async (fastify) => {
  const dbPath = path.resolve(process.cwd(), 'dist/corpus.sqlite')
  const repo = new SqliteCorpusRepository(dbPath)

  fastify.decorate('repo', repo)

  fastify.addHook('onClose', async () => {
    repo.close()
  })
}

import type { SqliteCorpusRepository } from '@moonwitness/corpus-node'

declare module 'fastify' {
  interface FastifyInstance {
    repo: SqliteCorpusRepository
  }
}

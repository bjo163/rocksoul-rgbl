import { buildApp } from '../../../apps/api/src/app.js'

export interface ServerOptions {
  port?: number
  dbPath?: string
  cors?: boolean
}

export async function startCorpusServer(options: ServerOptions = {}): Promise<ReturnType<typeof buildApp>> {
  const port = options.port ?? 3030
  const app = await buildApp()

  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🚀 MoonWitness Corpus Engine API Server Online at http://0.0.0.0:${port}`)

  return app
}

import { buildApp } from './app.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    const address = await app.listen({ port: PORT, host: HOST })
    console.log('\n===============================================================')
    console.log('🚀 MoonWitness Fastify Corpus Engine Online')
    console.log(`📡 Base URL: ${address}`)
    console.log(`📖 Swagger UI Docs: ${address}/docs`)
    console.log(`🔍 Health Check: ${address}/v1/health`)
    console.log('===============================================================\n')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

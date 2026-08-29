import { createRequire } from 'node:module'
import path from 'node:path'
import { UniversalCorpusRegistry } from '../packages/ingestion/src/registry/universal-registry.js'

async function run() {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()
  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  console.log(`Current Baseline:`)
  console.log(`- Traditions (${traditions.length}):`, traditions.map(t => t.id).join(', '))
  console.log(`- Works: ${works.length}`)
  console.log(`- Editions: ${editions.length}`)
  console.log(`- Sources: ${sources.length}`)
  console.log(`- Endpoints: ${endpoints.length}`)
}

run().catch(console.error)

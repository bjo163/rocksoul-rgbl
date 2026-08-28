export * from './server.js'
export * from './openapi.js'

import { startCorpusServer } from './server.js'

// Direct launch
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const port = parseInt(process.env.PORT || '3030', 10)
  startCorpusServer({ port })
}

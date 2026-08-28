import { performance } from 'node:perf_hooks'
import path from 'node:path'
import { SqliteCorpusRepository } from '../packages/node/src/sqlite-repository.js'

async function runBenchmark() {
  const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
  console.log('\n===============================================================')
  console.log('⚡ MoonWitness Corpus Engine — High-Performance Benchmark Suite')
  console.log('===============================================================\n')

  const startOpen = performance.now()
  const repo = SqliteCorpusRepository.open(dbPath)
  const openDuration = performance.now() - startOpen
  console.log(`✓ Database Mount Latency: ${openDuration.toFixed(2)} ms`)

  // 1. Single Record Lookups
  const recordQueries = [
    { name: 'Bhagavad Gita 2:47 (Sanskrit+English)', id: 'mw:passage:hinduism:bhagavad-gita:2:47' },
    { name: 'Tao Te Ching Chapter 1 (Chinese+English)', id: 'mw:passage:taoism:tao-te-ching:1' },
    { name: 'Hadith Nawawi 1 (Arabic+Indonesian)', id: 'mw:passage:hadith:nawawi-40:1' },
    { name: 'Yoga Sutra 1:1 (Sanskrit+English)', id: 'mw:passage:hinduism:yoga-sutras:1:1' },
    { name: 'Analects 1:1 (Classical Chinese)', id: 'mw:passage:confucianism:analects:1:1' }
  ]

  const singleResults: any[] = []
  for (const q of recordQueries) {
    const t0 = performance.now()
    const res = repo.getPassageWithContents(q.id as any)
    const dt = performance.now() - t0
    singleResults.push({
      Query: q.name,
      'Latency (ms)': dt.toFixed(3),
      Contents: res?.contents.length ?? 0,
      Status: res ? '✓ PASS' : '✗ FAIL'
    })
  }
  console.log('\n--- 1. Parallel Scripture Passage Lookups ---')
  console.table(singleResults)

  // 2. High-Throughput Stress Test (1,000 Sequential Queries)
  console.log('\n--- 2. High-Throughput Stress Test (1,000 Lookups) ---')
  const iterations = 1000
  const latencies: number[] = []
  const tStart = performance.now()

  for (let i = 1; i <= iterations; i++) {
    const chapter = (i % 18) + 1
    const verse = (i % 20) + 1
    const passageId = `mw:passage:hinduism:bhagavad-gita:${chapter}:${verse}`
    const t0 = performance.now()
    repo.getPassageWithContents(passageId as any)
    latencies.push(performance.now() - t0)
  }

  const totalTime = performance.now() - tStart
  latencies.sort((a, b) => a - b)
  const p50 = latencies[Math.floor(iterations * 0.5)].toFixed(3)
  const p95 = latencies[Math.floor(iterations * 0.95)].toFixed(3)
  const p99 = latencies[Math.floor(iterations * 0.99)].toFixed(3)
  const opsPerSec = ((iterations / totalTime) * 1000).toFixed(0)

  console.table([
    {
      TotalQueries: iterations,
      TotalTimeMs: totalTime.toFixed(1),
      Throughput: `${opsPerSec} queries/sec`,
      'p50 (ms)': p50,
      'p95 (ms)': p95,
      'p99 (ms)': p99
    }
  ])

  // 3. Multilingual Full-Text Search (FTS5) Benchmark
  console.log('\n--- 3. Multilingual Full-Text Search (FTS5) ---')
  const searchTerms = [
    { term: 'Dharma', lang: 'Sanskrit / Universal' },
    { term: 'Ar-Rahman', lang: 'Arabic / Islam' },
    { term: 'Heaven and Earth', lang: 'English / Taoism' },
    { term: 'amalan', lang: 'Indonesian / Hadith' },
    { term: 'Keadilan', lang: 'Indonesian / Ethics' }
  ]

  const searchResults: any[] = []
  for (const s of searchTerms) {
    const t0 = performance.now()
    const hits = await repo.search({ text: s.term, limit: 10 })
    const dt = performance.now() - t0
    searchResults.push({
      'Search Term': s.term,
      Context: s.lang,
      Hits: hits.length,
      'Latency (ms)': dt.toFixed(3)
    })
  }
  console.table(searchResults)

  // 4. Memory Footprint
  const mem = process.memoryUsage()
  console.log('\n--- 4. Memory Footprint ---')
  console.table([
    {
      'RSS (MB)': (mem.rss / 1024 / 1024).toFixed(2),
      'Heap Used (MB)': (mem.heapUsed / 1024 / 1024).toFixed(2),
      'Heap Total (MB)': (mem.heapTotal / 1024 / 1024).toFixed(2)
    }
  ])

  repo.close()
  console.log('✓ Benchmark completed successfully.\n')
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err)
  process.exitCode = 1
})

import { createRequire } from 'node:module'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const root = process.cwd()
const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(path.join(root, file), 'utf8')) as T
const count = (db: any, sql: string): number => Number(db.prepare(sql).get().count ?? 0)

async function main() {
  const traditions = await readJson<{ traditions: unknown[] }>('config/traditions.json')
  const works = await readJson<{ works: unknown[] }>('config/works.json')
  const editions = await readJson<{ editions: unknown[] }>('config/editions.json')

  const dbPath = path.join(root, 'dist/corpus.sqlite')
  if (!existsSync(dbPath)) throw new Error('dist/corpus.sqlite not found. Run pnpm build:sqlite first.')

  const db = new DatabaseSync(dbPath)
  const indexedRecords = count(db, 'SELECT COUNT(*) AS count FROM contents')
  const passages = count(db, 'SELECT COUNT(*) AS count FROM passages')
  const materializedWorks = count(db, 'SELECT COUNT(DISTINCT work_id) AS count FROM contents')
  const materializedEditions = count(db, 'SELECT COUNT(DISTINCT edition_id) AS count FROM contents WHERE edition_id IS NOT NULL')
  const languages = count(db, 'SELECT COUNT(DISTINCT language) AS count FROM contents')
  const devotionals = count(db, 'SELECT COUNT(*) AS count FROM devotionals')
  const lexiconTerms = count(db, 'SELECT COUNT(*) AS count FROM lexicon_terms')
  const rawRecords = count(db, 'SELECT COUNT(*) AS count FROM raw_records')
  db.close()

  const dbSize = (await stat(dbPath)).size
  const generatedAt = new Date().toISOString()
  const registryEditions = editions.editions.length
  const editionMaterialization = registryEditions === 0 ? 0 : (materializedEditions / registryEditions) * 100

  const stats = [
    '<!-- CORPUS_STATS_START -->',
    '## 📊 Live Corpus Statistics',
    '',
    '> Generated automatically from `config/*.json` and the built `dist/corpus.sqlite`. These numbers are not maintained manually.',
    '',
    '| Metric | Actual | Meaning |',
    '|---|---:|---|',
    `| 🌍 Registered traditions | ${traditions.traditions.length.toLocaleString()} | Entries in the tradition registry |`,
    `| 📚 Registered works | ${works.works.length.toLocaleString()} | Canonical work registry |`,
    `| 📖 Registered editions | ${registryEditions.toLocaleString()} | Edition registry |`,
    `| 🧾 Indexed text records | ${indexedRecords.toLocaleString()} | Actual materialized \`contents\` rows |`,
    `| 🧩 Passages | ${passages.toLocaleString()} | Actual searchable passage units |`,
    `| ✅ Materialized works | ${materializedWorks.toLocaleString()} | Works with real textual records |`,
    `| 📦 Materialized editions | ${materializedEditions.toLocaleString()} / ${registryEditions.toLocaleString()} | ${editionMaterialization.toFixed(2)}% of registered editions |`,
    `| 🌐 Content languages | ${languages.toLocaleString()} | Distinct languages in materialized content |`,
    `| 🙏 Devotional records | ${devotionals.toLocaleString()} | Duas, prayers, attributes, etc. |`,
    `| 🔤 Lexicon terms | ${lexiconTerms.toLocaleString()} | Indexed lexicon entries |`,
    `| 🗃️ Raw records | ${rawRecords.toLocaleString()} | Universal raw-record store |`,
    `| 💾 SQLite size | ${(dbSize / 1024 / 1024).toFixed(2)} MB | Generated database size |`,
    '',
    `_Last generated: ${generatedAt}_`,
    '<!-- CORPUS_STATS_END -->'
  ].join('\n')

  const readmePath = path.join(root, 'README.md')
  let readme = await readFile(readmePath, 'utf8')
  const start = '<!-- CORPUS_STATS_START -->'
  const end = '<!-- CORPUS_STATS_END -->'
  const startIndex = readme.indexOf(start)
  const endIndex = readme.indexOf(end)
  if (startIndex >= 0 && endIndex >= startIndex) {
    readme = `${readme.slice(0, startIndex)}${stats}${readme.slice(endIndex + end.length)}`
  } else {
    const marker = '\n---\n\n'
    const insertAt = readme.indexOf(marker)
    readme = insertAt >= 0
      ? `${readme.slice(0, insertAt + marker.length)}${stats}\n\n${readme.slice(insertAt + marker.length)}`
      : `${readme.trimEnd()}\n\n${stats}\n`
  }

  await writeFile(readmePath, readme)
  console.log(JSON.stringify({ generatedAt, indexedRecords, passages, materializedWorks, materializedEditions, registeredEditions, editionMaterializationPercent: Number(editionMaterialization.toFixed(2)), languages, devotionals, lexiconTerms, rawRecords, dbSizeBytes: dbSize }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

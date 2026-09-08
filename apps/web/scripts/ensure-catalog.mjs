import { access, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = path.join(root, "public", "corpus-catalog.json")

try {
  await access(output)
  console.log("Canonical corpus catalog already present.")
  process.exit(0)
} catch {}

const repository = process.env.RGBL_CATALOG_REPOSITORY || process.env.GITHUB_REPOSITORY || "bjo163/rocksoul-rgbl"
const ref = process.env.RGBL_CATALOG_REF || "main"
const source = process.env.RGBL_CATALOG_URL || `https://raw.githubusercontent.com/${repository}/${ref}/apps/web/public/corpus-catalog.json`

const response = await fetch(source, { headers: { accept: "application/json" } })
if (!response.ok) throw new Error(`Unable to fetch canonical corpus catalog: ${response.status}`)
const text = await response.text()
const catalog = JSON.parse(text)
if (catalog?.schemaVersion !== 1 || typeof catalog?.corpusHash !== "string" || (catalog?.summary?.totalRecords ?? 0) < 500000) {
  throw new Error("Fetched corpus catalog failed integrity contract")
}
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, text.endsWith("\n") ? text : text + "\n", "utf8")
console.log(`Fetched canonical corpus catalog ${catalog.catalogHash} with ${catalog.summary.totalRecords} records.`)

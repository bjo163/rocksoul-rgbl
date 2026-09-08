import { copyFile, mkdir, readFile, rm, writeFile, access } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(root, "public")
const databaseRoot = path.join(publicDir, "corpus-db")
const vendorDir = path.join(publicDir, "vendor/sqlite-httpvfs")
const runtimeConfigFile = path.join(databaseRoot, "config.json")
const catalogFile = path.join(publicDir, "corpus-catalog.json")

async function exists(file) {
  try { await access(file); return true } catch { return false }
}

await mkdir(vendorDir, { recursive: true })
for (const file of ["sqlite.worker.js", "sql-wasm.wasm"]) {
  await copyFile(path.join(root, "node_modules/sql.js-httpvfs/dist", file), path.join(vendorDir, file))
}

const catalog = JSON.parse(await readFile(catalogFile, "utf8"))
if (!catalog?.corpusHash) throw new Error("Canonical corpus hash is unavailable")

if (await exists(runtimeConfigFile)) {
  const existing = JSON.parse(await readFile(runtimeConfigFile, "utf8"))
  if (existing?.schemaVersion === 2 && existing?.corpusHash === catalog.corpusHash && existing?.serverMode === "chunked") {
    console.log("Browser corpus database already present:", existing.corpusHash)
    process.exit(0)
  }
}

const repository = process.env.RGBL_BROWSER_DB_REPOSITORY || process.env.GITHUB_REPOSITORY || "bjo163/rocksoul-rgbl"
const tag = "browser-db-" + catalog.corpusHash
const source = process.env.RGBL_BROWSER_DB_URL
  || `https://github.com/${repository}/releases/download/${tag}/rgbl-browser-db.tar.gz`
const archive = path.join("/tmp", "rgbl-browser-db-" + catalog.corpusHash + ".tar.gz")
const versionDir = path.join(databaseRoot, catalog.corpusHash)
const sourceConfig = path.join(versionDir, "config.json")

const response = await fetch(source)
if (!response.ok) throw new Error("Unable to fetch browser corpus database: " + response.status)
await writeFile(archive, new Uint8Array(await response.arrayBuffer()))

await mkdir(databaseRoot, { recursive: true })
await rm(versionDir, { recursive: true, force: true })
await mkdir(versionDir, { recursive: true })
await run("tar", ["-xzf", archive, "-C", versionDir])

const config = JSON.parse(await readFile(sourceConfig, "utf8"))
if (config?.schemaVersion !== 2 || config?.corpusHash !== catalog.corpusHash || config?.serverMode !== "chunked") {
  throw new Error("Browser database does not match canonical catalog/hash/schema contract")
}

const runtimeConfig = {
  ...config,
  urlPrefix: `/corpus-db/${catalog.corpusHash}/db.sqlite3.`,
}
await writeFile(runtimeConfigFile, JSON.stringify(runtimeConfig, null, 2) + "\n", "utf8")
console.log(`Fetched browser corpus DB ${tag}: ${config.databaseLengthBytes} bytes across content-addressed chunks.`)

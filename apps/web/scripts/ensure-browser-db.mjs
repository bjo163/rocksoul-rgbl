import { copyFile, mkdir, readFile, rm, writeFile, access } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"

const run = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = path.join(root, "public")
const databaseDir = path.join(publicDir, "corpus-db")
const vendorDir = path.join(publicDir, "vendor/sqlite-httpvfs")
const configFile = path.join(databaseDir, "config.json")
const catalogFile = path.join(publicDir, "corpus-catalog.json")

async function exists(file) {
  try { await access(file); return true } catch { return false }
}

await mkdir(vendorDir, { recursive: true })
for (const file of ["sqlite.worker.js", "sql-wasm.wasm"]) {
  await copyFile(path.join(root, "node_modules/sql.js-httpvfs/dist", file), path.join(vendorDir, file))
}

if (await exists(configFile)) {
  console.log("Browser corpus database already present.")
  process.exit(0)
}

const catalog = JSON.parse(await readFile(catalogFile, "utf8"))
if (!catalog?.corpusHash) throw new Error("Canonical corpus hash is unavailable")

const repository = process.env.RGBL_BROWSER_DB_REPOSITORY || process.env.GITHUB_REPOSITORY || "bjo163/rocksoul-rgbl"
const tag = "browser-db-" + catalog.corpusHash
const source = process.env.RGBL_BROWSER_DB_URL
  || `https://github.com/${repository}/releases/download/${tag}/rgbl-browser-db.tar.gz`
const archive = path.join("/tmp", "rgbl-browser-db-" + catalog.corpusHash + ".tar.gz")

const response = await fetch(source)
if (!response.ok) throw new Error("Unable to fetch browser corpus database: " + response.status)
await writeFile(archive, new Uint8Array(await response.arrayBuffer()))
await rm(databaseDir, { recursive: true, force: true })
await mkdir(databaseDir, { recursive: true })
await run("tar", ["-xzf", archive, "-C", databaseDir])

const config = JSON.parse(await readFile(configFile, "utf8"))
if (config?.schemaVersion !== 2 || config?.corpusHash !== catalog.corpusHash || config?.serverMode !== "chunked") {
  throw new Error("Browser database does not match canonical catalog hash")
}
console.log(`Fetched browser corpus DB ${tag}: ${config.databaseLengthBytes} bytes.`)

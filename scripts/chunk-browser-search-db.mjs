import { createReadStream, createWriteStream } from "node:fs"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { once } from "node:events"

const input = path.resolve(process.argv[2] ?? "dist/browser/corpus-search.sqlite")
const output = path.resolve(process.argv[3] ?? "dist/browser/chunks")
const serverChunkSize = 10 * 1024 * 1024
const requestChunkSize = 4096
const suffixLength = 3

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
const { size } = await stat(input)

let index = 0
let current
let currentBytes = 0
function openChunk() {
  const suffix = String(index).padStart(suffixLength, "0")
  current = createWriteStream(path.join(output, "db.sqlite3." + suffix))
  currentBytes = 0
  index += 1
}
openChunk()

for await (const sourceChunk of createReadStream(input, { highWaterMark: 1024 * 1024 })) {
  let offset = 0
  while (offset < sourceChunk.length) {
    if (!current) openChunk()
    const remaining = serverChunkSize - currentBytes
    const take = Math.min(remaining, sourceChunk.length - offset)
    if (!current.write(sourceChunk.subarray(offset, offset + take))) await once(current, "drain")
    currentBytes += take
    offset += take
    if (currentBytes === serverChunkSize && offset < sourceChunk.length) {
      current.end()
      await once(current, "close")
      openChunk()
    } else if (currentBytes === serverChunkSize && offset === sourceChunk.length) {
      current.end()
      await once(current, "close")
      current = null
      currentBytes = 0
    }
  }
}
if (current) {
  current.end()
  await once(current, "close")
}

const catalog = JSON.parse(await readFile(path.resolve("apps/web/public/corpus-catalog.json"), "utf8"))
const config = {
  schemaVersion: 1,
  corpusHash: catalog.corpusHash,
  serverMode: "chunked",
  requestChunkSize,
  databaseLengthBytes: size,
  serverChunkSize,
  urlPrefix: "db.sqlite3.",
  suffixLength,
}
await writeFile(path.join(output, "config.json"), JSON.stringify(config, null, 2) + "\n")
console.log(JSON.stringify({ ...config, chunks: Math.ceil(size / serverChunkSize) }, null, 2))

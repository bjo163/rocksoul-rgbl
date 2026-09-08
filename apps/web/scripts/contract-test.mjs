import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const read = (file) => readFile(path.join(root, file), "utf8")

const [data, main, api, pkgRaw, indexHtml, styles] = await Promise.all([
  read("src/data.ts"),
  read("src/main.tsx"),
  read("src/api.ts"),
  read("package.json"),
  read("index.html"),
  read("src/styles.css"),
])

const pkg = JSON.parse(pkgRaw)
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const id of [
  "mw:work:new-testament",
  "mw:work:hebrew-bible",
  "mw:work:bible:web-classic",
  "mw:work:hinduism:bhagavad-gita",
  "mw:work:shinto:kojiki",
]) expect(data.includes(id), `missing canonical fallback ID ${id}`)

for (const id of [
  "mw:work:sblgnt",
  "mw:work:wlc",
  "mw:work:web-classic",
  "mw:work:bhagavad-gita",
  "mw:work:kojiki",
]) expect(!data.includes(`id: "${id}"`), `legacy non-canonical fallback ID remains: ${id}`)

expect(pkg.dependencies?.["@rocksoul/ui"] === "github:bjo163/rocksoul-ui#c7d3402614408c9812a7ab5370873dab3f821a2f", "Rocksoul UI must be pinned to the reviewed commit")
expect(!main.includes("raw.githubusercontent.com/bjo163/rocksoul-assets/main"), "runtime must not consume a floating rocksoul-assets/main URL")
expect(!main.includes("ASSET_BASE"), "runtime must use the stable @rocksoul/ui asset resolver")
expect(indexHtml.includes("82f20b8a361a19abdc6591fe2f4c67e3fb9d4b05"), "document assets must use the stable Rocksoul asset release")
expect(api.includes("/v1/passages/"), "passage trace API adapter is missing")
expect(api.includes("/v1/assertions/"), "assertion traversal API adapter is missing")
expect(api.includes("payload.data"), "API adapter must consume canonical response envelopes")
expect(main.includes("WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT"), "canonical textual hierarchy is not surfaced")
expect(main.includes("lang={lane.language}"), "exact text lanes must carry language metadata")
expect(main.includes("dir={textDirection(lane.script)}"), "RTL/LTR text direction handling is missing")
expect(main.includes("STATIC SEMANTIC GUARDRAILS"), "static matrix must be labeled as a contract rather than live evidence")
expect(styles.includes("prefers-reduced-motion"), "reduced-motion contract is missing")
expect(styles.includes("focus-visible"), "visible focus contract is missing")

if (failures.length) {
  console.error("RGBL web contract smoke failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("RGBL web contract smoke: OK")

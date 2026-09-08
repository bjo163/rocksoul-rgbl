import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const read = (file) => readFile(path.join(root, file), "utf8")

const [data, main, api, pkgRaw, indexHtml, styles, generator, semanticRules, catalog] = await Promise.all([
  read("src/data.ts"),
  read("src/main.tsx"),
  read("src/api.ts"),
  read("package.json"),
  read("index.html"),
  read("src/styles.css"),
  read("../../scripts/export-web-catalog.mjs"),
  read("../../config/textual-semantic-rules.json"),
  read("public/corpus-catalog.json"),
])

const pkg = JSON.parse(pkgRaw)
const rules = JSON.parse(semanticRules)
const generated = JSON.parse(catalog)
const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const legacy of [
  "fallbackTraditions",
  "fallbackWorks",
  "fallbackPassages",
  "fallbackSearchRecords",
  "evidenceRows",
]) expect(!data.includes(legacy), `hardcoded UI fallback remains: ${legacy}`)

expect(pkg.dependencies?.["@rocksoul/ui"] === "github:bjo163/rocksoul-ui#1730eda55564654dc8d4131bbdbf126d0c2d1eca", "Rocksoul UI must be pinned to the merged textual-intelligence release")
expect(!main.includes("raw.githubusercontent.com/bjo163/rocksoul-assets/main"), "runtime must not consume rocksoul-assets/main")
expect(!main.includes("ASSET_BASE"), "runtime must use the stable @rocksoul/ui asset resolver")
expect(indexHtml.includes("82f20b8a361a19abdc6591fe2f4c67e3fb9d4b05"), "document assets must use the stable Rocksoul asset release")
expect(api.includes("/v1/passages/"), "passage trace API adapter is missing")
expect(api.includes("/v1/assertions/"), "assertion traversal API adapter is missing")
expect(api.includes('const CATALOG_URL = "/corpus-catalog.json"'), "generated catalog adapter is missing")
expect(api.includes("loadCatalog"), "catalog loader is missing")
expect(generator.includes('datasets/registry.json'), "catalog generator must use the canonical dataset registry")
expect(generator.includes('config/upstream-registry.json'), "catalog generator must use the upstream tradition registry")
expect(generator.includes('config/textual-semantic-rules.json'), "catalog generator must use machine-readable semantic rules")
expect(Array.isArray(rules.rules) && rules.rules.length >= 6, "machine-readable semantic rules are incomplete")
expect(generated.schemaVersion === 1, "generated corpus catalog schema version is invalid")
expect(typeof generated.corpusHash === "string" && generated.corpusHash.length === 64, "generated corpus catalog must be content-addressed")
expect(generated.summary?.totalRecords > 500000, "generated canonical catalog must represent the full non-fixture corpus inventory")
expect(generated.summary?.workCount > 0 && generated.summary?.sampledPassageCount > 0, "generated catalog must expose canonical work and passage samples")
expect(main.includes("WORK → EXPRESSION → EDITION → ARTIFACT → PASSAGE → CONTENT"), "canonical textual hierarchy is not surfaced")
for (const component of ["TextualHierarchyTrace", "ParallelTextLanes", "SourceRightsSummary", "TextualRelationTrace"]) {
  expect(main.includes(component), `merged Rocksoul UI component is not used: ${component}`)
}
expect(main.includes("STATIC SEMANTIC GUARDRAILS"), "semantic matrix must be labeled as a contract rather than live evidence")
expect(styles.includes("prefers-reduced-motion"), "reduced-motion contract is missing")
expect(styles.includes("focus-visible"), "visible focus contract is missing")

if (failures.length) {
  console.error("RGBL web contract smoke failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("RGBL web contract smoke: OK")

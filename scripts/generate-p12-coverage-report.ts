import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { assertCoverageMatrix } from './coverage-matrix.js'

type Registry = { datasets: Array<{ id: string; path: string; status: string }> }
type Coverage = { datasets: Array<Record<string, any>> }
const root = process.cwd()
async function filesUnder(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await filesUnder(file))
    else if (entry.isFile() && file.endsWith('.jsonl')) result.push(file)
  }
  return result
}
const registry = JSON.parse(await readFile(path.join(root, 'datasets/registry.json'), 'utf8')) as Registry
const coverage = JSON.parse(await readFile(path.join(root, 'datasets/coverage.json'), 'utf8')) as Coverage
await assertCoverageMatrix(root)

const rows = []
for (const entry of coverage.datasets) {
  const registered = registry.datasets.find((item) => item.id === entry.datasetId)
  if (!registered || registered.status !== 'active') continue
  const manifestPath = path.join(root, registered.path, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { partitions?: Array<{ path: string }> }
  const datasetRoot = path.dirname(manifestPath)
  const files = (await filesUnder(datasetRoot)).filter((file) => (manifest.partitions ?? []).some((partition) => file.startsWith(path.join(datasetRoot, partition.path.split('*')[0])))).sort()
  let recordCount = 0
  for (const file of files) recordCount += (await readFile(file, 'utf8')).split(/\r?\n/).filter(Boolean).length
  rows.push({
    datasetId: entry.datasetId,
    workCollection: entry.workCollection,
    datasetRole: entry.datasetRole,
    completeness: entry.completeness,
    recordCount,
    sourceLanguage: entry.sourceLanguageCoverage?.language ?? null,
    sourceLanguageStatus: entry.sourceLanguageCoverage?.status ?? 'not_applicable',
    english: entry.translationCoverage?.en ?? 'not_declared',
    indonesian: entry.translationCoverage?.id ?? 'not_declared',
    rights: entry.rights,
    alignment: entry.alignmentCoverage,
    sourceArtifact: entry.sourceArtifact,
  })
}
const bundled = rows.filter((row) => coverage.datasets.find((entry) => entry.datasetId === row.datasetId)?.availability === 'bundled')
const rightsGate = bundled.every((row) => String(row.rights.status).startsWith('verified_for_bundled_'))
const languageGaps = rows.filter((row) => row.datasetRole === 'translation' && (row.english !== 'complete' || row.indonesian !== 'complete')).map((row) => ({ datasetId: row.datasetId, english: row.english, indonesian: row.indonesian }))
const report = {
  formatVersion: '1', generatedAt: '2026-08-27T00:00:00Z', scope: 'P12 Foundation Text Corpus',
  totals: { activeDatasets: rows.length, records: rows.reduce((sum, row) => sum + row.recordCount, 0), coveredUnits: rows.reduce((sum, row) => sum + Number(row.completeness.covered), 0) },
  gates: { noUnresolvedBundledRights: { status: rightsGate ? 'pass' : 'fail', detail: 'Every bundled dataset has a verified bundled-rights status.' }, requiredSourceEnglishIndonesian: { status: languageGaps.length === 0 ? 'pass' : 'blocked', detail: 'Human source-language, English, and Indonesian coverage is not yet complete for every major translation collection.', gaps: languageGaps } },
  datasets: rows,
}
await writeFile(path.join(root, 'docs/P12-FOUNDATION-COVERAGE-REPORT.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
const markdown = [`# P12 Foundation Text Corpus coverage report`, ``, `Generated from the active coverage matrix and dataset manifests. This report is deterministic and records gaps explicitly.`, ``, `- Active datasets: **${report.totals.activeDatasets}**`, `- JSONL records: **${report.totals.records}**`, `- Covered units: **${report.totals.coveredUnits}**`, `- Bundled-rights gate: **${report.gates.noUnresolvedBundledRights.status}**`, `- Source + human English + Indonesian gate: **${report.gates.requiredSourceEnglishIndonesian.status}**`, ``, `| Collection | Records | Units | Source | English | Indonesian | Rights |`, `|---|---:|---:|---|---|---|---|`, ...rows.map((row) => `| ${row.workCollection} | ${row.recordCount} | ${row.completeness.covered}${row.completeness.expected === null ? '' : `/${row.completeness.expected}`} | ${row.sourceLanguageStatus} | ${row.english} | ${row.indonesian} | ${row.rights.status} |`), ``, `## Open language gaps`, ``, ...languageGaps.map((gap) => `- ${gap.datasetId}: English=${gap.english}, Indonesian=${gap.indonesian}`), ``].join('\n')
await writeFile(path.join(root, 'docs/P12-FOUNDATION-COVERAGE-REPORT.md'), markdown, 'utf8')
console.log(`Generated P12 report for ${rows.length} datasets and ${report.totals.records} records`)

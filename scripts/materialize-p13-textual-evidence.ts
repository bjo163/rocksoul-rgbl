import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const dataset = 'datasets/world-religions-textual-evidence'
const provenance = 'mw:provenance:p13:textual-evidence:2026-08-27'
const artifact = 'mw:artifact:p13:textual-evidence'
const evidence = [
  ['mw:person:moses', 'mw:role:prophet', 'mw:tradition:islam', 'mw:content:quran:2:87:ar-uthmani', 'quran'],
  ['mw:person:jesus', 'mw:role:prophet', 'mw:tradition:islam', 'mw:content:quran:2:87:ar-uthmani', 'quran'],
  ['mw:person:muhammad', 'mw:role:prophet', 'mw:tradition:islam', 'mw:content:quran:33:40:ar-uthmani', 'quran'],
  ['mw:person:muhammad', 'mw:role:messenger', 'mw:tradition:islam', 'mw:content:quran:33:40:ar-uthmani', 'quran'],
  ['mw:person:moses', 'mw:role:scriptural-figure', 'mw:tradition:judaism', 'mw:content:oshb:wlc:exod:3:1', 'wlc'],
  ['mw:person:abraham', 'mw:role:scriptural-figure', 'mw:tradition:judaism', 'mw:content:oshb:wlc:gen:12:1', 'wlc'],
  ['mw:person:paul-the-apostle', 'mw:role:apostle', 'mw:tradition:christianity', 'mw:content:sblgnt:v1-2:1cor:1:1', 'sblgnt']
] as const
const records: CorpusRecord[] = [
  { id: artifact, record_type: 'resource', kind: 'source.snapshot', labels: [{ value: 'P13 textual evidence links', role: 'preferred', language: 'en' }] },
  { id: provenance, record_type: 'provenance', source: artifact, source_reference: 'Pinned P12 passage IDs; metadata-only evidence layer', activities: [{ type: 'mapping', method: 'Deterministic reviewed person-role-to-passage links', software: { name: 'scripts/materialize-p13-textual-evidence.ts', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }] }
] as CorpusRecord[]
for (const [index, [subject, role, tradition, passage, source]] of evidence.entries()) records.push({ id: `mw:assertion:p13:textual-evidence:${index + 1}`, record_type: 'assertion', subject, predicate: 'mw:predicate:has-role', object: { entity: role }, assertion_class: 'textual_evidence', evidence: [passage], provenance, scope: { tradition }, extensions: { source, note: 'The linked P12 passage is the exact evidence target; interpretive role semantics remain scoped registry claims.' } } as CorpusRecord)
const base = path.join(root, dataset, 'data/core')
for (const [type, values] of [['assertions', records.filter(r => r.record_type === 'assertion')], ['resources', records.filter(r => r.record_type === 'resource')], ['provenance', records.filter(r => r.record_type === 'provenance')]] as const) { const dir = path.join(base, type); await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'p13-textual-evidence.jsonl'), deterministicJsonl(values), 'utf8') }
const files = [`${dataset}/data/core/assertions/p13-textual-evidence.jsonl`, `${dataset}/data/core/provenance/p13-textual-evidence.jsonl`, `${dataset}/data/core/resources/p13-textual-evidence.jsonl`, `${dataset}/manifest.json`, `${dataset}/README.md`]
const checksums = await Promise.all(files.map(async file => `${createHash('sha256').update(await readFile(path.join(root, file))).digest('hex')}  ${file}`))
await writeFile(path.join(root, dataset, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
console.log(`materialized ${records.length} P13 textual-evidence records`)

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd(); const snap = path.join(root, 'datasets/registries/snapshots/wikidata/entities')
const artifact = 'mw:artifact:wikidata:p13-baseline-2026-08-27'; const provenance = 'mw:provenance:wikidata:p13-baseline-2026-08-27'
const traditions: Record<string, string> = { Q5043: 'christianity', Q432: 'islam', Q9268: 'judaism', Q748: 'buddhism', Q9089: 'hinduism', Q9232: 'jainism', Q9316: 'sikhism', Q22679: 'bahai-faith', Q9601: 'zoroastrianism', Q9598: 'daoism', Q9581: 'confucianism', Q812767: 'shinto' }
const movements: Record<string, string> = { Q483654: 'sunni-islam', Q9585: 'shia-islam', Q132265: 'theravada', Q48362: 'mahayana', Q9592: 'catholic-church', Q23540: 'protestantism' }
const people: Record<string, string> = { Q302: 'jesus', Q9458: 'muhammad', Q9077: 'moses', Q9181: 'abraham', Q9441: 'gautama-buddha', Q9422: 'mahavira', Q9333: 'laozi', Q4604: 'confucius', Q42891: 'krishna', Q35811: 'zoroaster', Q83322: 'guru-nanak', Q9200: 'paul-the-apostle', Q101054: 'bahaullah', Q47102: 'joseph-smith', Q558420: 'wovoka', Q235069: 'mary-baker-eddy', Q292290: 'ellen-g-white', Q41178: 'haile-selassie' }
const roleClaims = [
  ['muhammad', 'prophet', 'islam'], ['jesus', 'scriptural_figure', 'christianity'], ['jesus', 'prophet', 'islam'],
  ['moses', 'prophet', 'judaism'], ['moses', 'prophet', 'christianity'], ['moses', 'prophet', 'islam'],
  ['abraham', 'patriarch', 'judaism'], ['abraham', 'scriptural_figure', 'christianity'], ['abraham', 'prophet', 'islam'],
  ['gautama-buddha', 'buddha', 'buddhism'], ['mahavira', 'tirthankara', 'jainism'], ['guru-nanak', 'guru', 'sikhism'],
  ['laozi', 'sage', 'daoism'], ['confucius', 'sage', 'confucianism'], ['zoroaster', 'prophet', 'zoroastrianism'], ['paul-the-apostle', 'apostle', 'christianity']
] as const
type EntityDoc = { entities: Record<string, { lastrevid: number; modified?: string; labels?: Record<string, { language: string; value: string }>; aliases?: Record<string, Array<{ language: string; value: string }>>; claims?: Record<string, Array<{ mainsnak: { datavalue?: { value?: { id?: string } } } }>> }> }
const docs = new Map<string, EntityDoc['entities'][string]>()
async function entity(qid: string) { if (!docs.has(qid)) { const doc = JSON.parse(await readFile(path.join(snap, `${qid}.json`), 'utf8')) as EntityDoc; docs.set(qid, doc.entities[qid]) } return docs.get(qid)! }
function slug(value: string): string { return value.normalize('NFKD').replaceAll(/[^A-Za-z0-9]+/gu, '-').replaceAll(/^-|-$/gu, '').toLowerCase() || 'unlabeled' }
function labels(source: EntityDoc['entities'][string]) { const out: Array<{ value: string; role: 'preferred' | 'alternate'; language?: string }> = []; for (const lang of ['en', 'id', 'ar', 'he', 'sa', 'pi', 'pa', 'fa', 'zh', 'ja']) { const label = source.labels?.[lang]; if (label) out.push({ value: label.value, role: 'preferred', language: lang }); for (const alias of source.aliases?.[lang] ?? []) if (alias.value !== label?.value) out.push({ value: alias.value, role: 'alternate', language: lang }) } return out.length ? out : [{ value: 'Unlabeled Wikidata entity', role: 'preferred' as const, language: 'en' }] }
function ext(qid: string, source: EntityDoc['entities'][string]) { return { external_ids: [{ scheme: 'wikidata', value: qid, uri: `https://www.wikidata.org/entity/${qid}` }], source_snapshot: { lastrevid: source.lastrevid, modified: source.modified, artifact, provenance } } }
const records: CorpusRecord[] = [{ id: artifact, record_type: 'resource', kind: 'source.snapshot', labels: [{ value: 'Wikidata P13 baseline snapshot 2026-08-27', role: 'preferred', language: 'en' }] }, { id: provenance, record_type: 'provenance', source: artifact, source_reference: 'Wikidata Special:EntityData bounded snapshot, CC0', activities: [{ type: 'acquisition', method: 'Pinned raw entity JSON with lastrevid and SHA-256 manifest', software: { name: 'scripts/materialize-p13-baseline.ts', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }] }] as CorpusRecord[]
const idByQid = new Map<string, string>()
for (const [qid, local] of Object.entries(traditions)) { const source = await entity(qid); const id = `mw:tradition:${local}`; idByQid.set(qid, id); records.push({ id, record_type: 'entity', kind: 'tradition', labels: labels(source), extensions: ext(qid, source) } as CorpusRecord) }
for (const [qid, local] of Object.entries(movements)) { const source = await entity(qid); const id = `mw:movement:${local}`; idByQid.set(qid, id); records.push({ id, record_type: 'entity', kind: 'religious_movement', labels: labels(source), extensions: ext(qid, source) } as CorpusRecord) }
for (const [qid, local] of Object.entries(people)) { const source = await entity(qid); const id = `mw:person:${local}`; idByQid.set(qid, id); records.push({ id, record_type: 'entity', kind: 'person', labels: labels(source), extensions: ext(qid, source) } as CorpusRecord) }
const relationTargets = new Map<string, 'classification' | 'place'>()
const classifiedQids = [...Object.keys(traditions), ...Object.keys(movements)]
for (const qid of classifiedQids) { const source = await entity(qid); for (const p of ['P279', 'P361']) for (const claim of source.claims?.[p] ?? []) { const target = claim.mainsnak.datavalue?.value?.id; if (target) relationTargets.set(target, 'classification') } for (const p of ['P495', 'P740', 'P17']) for (const claim of source.claims?.[p] ?? []) { const target = claim.mainsnak.datavalue?.value?.id; if (target && !relationTargets.has(target)) relationTargets.set(target, 'place') } }
for (const [qid, type] of relationTargets) { const source = await entity(qid); const name = source.labels?.en?.value ?? qid; const id = type === 'place' ? `mw:place:${slug(name)}` : `mw:tradition-classification:${slug(name)}`; idByQid.set(qid, id); records.push({ id, record_type: 'entity', kind: type === 'place' ? 'place' : 'tradition.classification', labels: labels(source), extensions: ext(qid, source) } as CorpusRecord) }
let assertion = 0
for (const qid of classifiedQids) { const source = await entity(qid); const subject = idByQid.get(qid)!; for (const [property, predicate] of [['P279', 'mw:predicate:broader-than'], ['P361', 'mw:predicate:related-to'], ['P495', 'mw:predicate:associated-with-geography'], ['P740', 'mw:predicate:associated-with-geography'], ['P17', 'mw:predicate:associated-with-geography']] as const) for (const claim of source.claims?.[property] ?? []) { const target = claim.mainsnak.datavalue?.value?.id; const object = target ? idByQid.get(target) : undefined; if (!object) continue; assertion += 1; records.push({ id: `mw:assertion:wikidata:p13:${assertion}`, record_type: 'assertion', subject, predicate, object: { entity: object }, assertion_class: 'source_summary', provenance, extensions: { wikidata: { subject: qid, property, object: target } } } as CorpusRecord) } }
for (const role of ['prophet', 'messenger', 'apostle', 'patriarch', 'founder', 'guru', 'rishi', 'tirthankara', 'buddha', 'bodhisattva', 'imam', 'saint', 'sage', 'reformer', 'teacher', 'scriptural_figure']) records.push({ id: `mw:role:${role.replaceAll('_', '-')}`, record_type: 'entity', kind: 'religious_role', labels: [{ value: role.replaceAll('_', ' '), role: 'preferred', language: 'en' }] } as CorpusRecord)
for (const [person, role, tradition] of roleClaims) { assertion += 1; records.push({ id: `mw:assertion:p13:role:${assertion}`, record_type: 'assertion', subject: `mw:person:${person}`, predicate: 'mw:predicate:has-role', object: { entity: `mw:role:${role.replaceAll('_', '-')}` }, assertion_class: 'source_summary', scope: { tradition: `mw:tradition:${tradition}` }, provenance, extensions: { note: 'Baseline reviewed role assertion; scope is essential and no global role is implied.' } } as CorpusRecord) }
for (const person of ['muhammad', 'jesus', 'moses', 'abraham', 'gautama-buddha', 'mahavira', 'krishna', 'zoroaster', 'laozi', 'confucius']) records.push({ id: `mw:assessment:p13:historicity:${person}`, record_type: 'assessment', target: `mw:person:${person}`, result: 'historicity_unresolved', method: 'Bounded Wikidata snapshot review; no independent historicity conclusion is asserted.', confidence: 0.5, evidence: [artifact], extensions: { p13: { status: 'uncertain', scope: 'bounded registry review' } } } as CorpusRecord)
const groups = new Map<string, CorpusRecord[]>(); for (const record of records) { const list = groups.get(record.record_type) ?? []; list.push(record); groups.set(record.record_type, list) }
const directoryByType: Record<string, string> = { entity: 'entities', resource: 'resources', assertion: 'assertions', provenance: 'provenance' }
const base = path.join(root, 'datasets/world-religions-baseline/data/core'); for (const [type, values] of groups) { const dir = path.join(base, directoryByType[type] ?? `${type}s`); await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'baseline.jsonl'), deterministicJsonl(values), 'utf8') }
const dataset = 'datasets/world-religions-baseline'
const checksumFiles = [
  `${dataset}/data/core/assertions/baseline.jsonl`, `${dataset}/data/core/entities/baseline.jsonl`,
  `${dataset}/data/core/provenance/baseline.jsonl`, `${dataset}/data/core/resources/baseline.jsonl`,
  `${dataset}/manifest.json`, `${dataset}/README.md`
]
const checksums = []
for (const file of checksumFiles) { const bytes = await readFile(path.join(root, file)); checksums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${file}`) }
await writeFile(path.join(root, dataset, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
console.log(`materialized ${records.length} P13 baseline records`)

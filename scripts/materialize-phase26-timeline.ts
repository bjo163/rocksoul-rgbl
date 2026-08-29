import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type Claim = { mainsnak?: { snaktype?: string; datavalue?: { value?: { time?: string; precision?: number } } }; rank?: string; id?: string; references?: Array<{ snaks?: Record<string, Array<{ datavalue?: { value?: any } }>> }> }
type Entity = { id: string; labels?: Record<string, { value: string }>; claims?: Record<string, Claim[]>; lastrevid?: number }

const root = process.cwd()
const snapshot = path.join(root, 'datasets/registries/snapshots/wikidata')
const out = path.join(root, 'datasets/world-religions-timeline-wikidata')
const sourceArtifact = 'mw:artifact:wikidata:p13-baseline-2026-08-27'
const provenance = 'mw:provenance:wikidata:timeline-2026-08-27'
const personMap = new Map<string, string>()
const entityFiles = ['Q101054','Q292290','Q4604','Q9441','Q83322','Q41178','Q302','Q47102','Q42891','Q9333','Q9422','Q9077','Q9458','Q9200','Q558420','Q35811','Q9181']

function sha256(value: Buffer | string): string { return createHash('sha256').update(value).digest('hex') }
function yearOf(time: string): number { return Number(time.slice(0, 5).replace('+', '').replace(/^(-?)0+/, '$1')) }
function precisionOf(value: number | undefined, alternatives: boolean): string {
  if (alternatives) return 'DISPUTED'
  if (value === 11) return 'EXACT_DATE'
  if (value === 9) return 'YEAR'
  if (value === 7) return 'CENTURY'
  return 'APPROXIMATE'
}
function refIds(claim: Claim): string[] {
  const ids = new Set<string>()
  for (const reference of claim.references ?? []) for (const key of ['P248', 'P854', 'P143']) for (const snak of reference.snaks?.[key] ?? []) {
    const value = snak.datavalue?.value
    if (typeof value === 'string' && (value.startsWith('http') || value.length > 0)) ids.add(value)
    else if (value?.id) ids.add(String(value.id))
  }
  return [...ids].sort()
}
function label(entity: Entity): string { return entity.labels?.en?.value ?? entity.id }
function eventId(person: string, type: string): string { return `mw:event:wikidata-${person.toLowerCase()}-${type.toLowerCase()}` }

const baseline = await readFile(path.join(root, 'datasets/world-religions-baseline/data/core/entities/baseline.jsonl'), 'utf8')
for (const line of baseline.trim().split(/\r?\n/)) {
  const record = JSON.parse(line)
  const qid = record.extensions?.external_ids?.find((x: any) => x.scheme === 'wikidata')?.value
  if (qid && record.id?.startsWith('mw:person:')) personMap.set(qid, record.id)
}

const entities: any[] = []
const assertions: any[] = []
const accepted: any[] = []
for (const qid of entityFiles) {
  const entity = Object.values((JSON.parse(await readFile(path.join(snapshot, `entities/${qid}.json`), 'utf8')) as { entities: Record<string, Entity> }).entities)[0]
  const person = personMap.get(entity.id)
  if (!person) continue
  for (const [property, eventType] of [['P569', 'BIRTH'], ['P570', 'DEATH']] as const) {
    const claims = (entity.claims?.[property] ?? []).filter((claim) => claim.mainsnak?.snaktype === 'value' && typeof claim.mainsnak.datavalue?.value?.time === 'string' && (claim.references?.length ?? 0) > 0)
    if (!claims.length) continue
    const values = claims.map((claim) => ({ value: claim.mainsnak!.datavalue!.value!.time!, precision: claim.mainsnak!.datavalue!.value!.precision ?? 0, sourceStatement: claim.id ?? `${entity.id}-${property}` }))
    const distinct = [...new Map(values.map((value) => [`${value.value}|${value.precision}`, value])).values()]
    const disputed = new Set(distinct.map((value) => value.value)).size > 1
    const primary = distinct[0]
    const event = eventId(person.split(':').pop()!, eventType)
    const sourceIds = [...new Set(claims.flatMap(refIds))]
    const temporal = { value: disputed ? undefined : primary.value, year: disputed ? undefined : yearOf(primary.value), precision: precisionOf(primary.precision, disputed), certainty: disputed ? 'LOW' : distinct.length > 1 ? 'MEDIUM' : 'HIGH', status: disputed ? 'DISPUTED' : 'SUPPORTED', alternatives: distinct.length > 1 ? distinct : undefined }
    entities.push({ id: event, kind: 'event', record_type: 'entity', labels: [{ language: 'en', role: 'preferred', value: `${eventType === 'BIRTH' ? 'Birth' : 'Death'} of ${label(entity)}` }], description: `A ${eventType.toLowerCase()} event normalized from a referenced Wikidata time claim; the source precision and disagreement status are preserved.`, extensions: { timeline: { eventType, temporal, subjectPerson: person, sourceEntity: entity.id, sourceStatementIds: claims.map((claim) => claim.id).filter(Boolean), sourceIds, datasetId: 'mw:dataset:world-religions:timeline-wikidata', datasetVersion: '0.1.0' }, external_ids: [{ scheme: 'wikidata', value: `${entity.id}:${property}`, uri: `https://www.wikidata.org/entity/${entity.id}` }] } })
    assertions.push({ id: `mw:assertion:wikidata:timeline:${person.split(':').pop()}:${eventType.toLowerCase()}`, record_type: 'assertion', subject: event, predicate: 'mw:predicate:related-to', object: { entity: person }, assertion_class: 'source_summary', evidence: [sourceArtifact], provenance, extensions: { timeline: { relation: 'PERSON_EVENT', sourceEntity: entity.id, property, sourceStatementIds: claims.map((claim) => claim.id).filter(Boolean), sourceIds } } })
    accepted.push({ qid: entity.id, property, event })
  }
}
entities.sort((a, b) => a.id.localeCompare(b.id)); assertions.sort((a, b) => a.id.localeCompare(b.id))
await mkdir(path.join(out, 'data/core/entities'), { recursive: true }); await mkdir(path.join(out, 'data/core/assertions'), { recursive: true }); await mkdir(path.join(out, 'data/core/provenance'), { recursive: true }); await mkdir(path.join(out, 'data/core/resources'), { recursive: true })
await writeFile(path.join(out, 'data/core/entities/timeline.jsonl'), `${entities.map((x) => JSON.stringify(x)).join('\n')}\n`)
await writeFile(path.join(out, 'data/core/assertions/timeline.jsonl'), `${assertions.map((x) => JSON.stringify(x)).join('\n')}\n`)
await writeFile(path.join(out, 'data/core/provenance/timeline.jsonl'), `${JSON.stringify({ id: provenance, record_type: 'provenance', source: 'mw:source:wikidata-timeline', source_reference: 'Pinned Wikidata Special:EntityData records in datasets/registries/snapshots/wikidata/entities', activities: [{ type: 'normalization', method: 'Referenced P569/P570 claims only; deterministic identity by person QID and property; source precision and alternatives preserved', software: { name: 'scripts/materialize-phase26-timeline.ts', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }]})}\n`)
await writeFile(path.join(out, 'data/core/resources/source.jsonl'), `${JSON.stringify({ id: 'mw:source:wikidata-timeline', kind: 'source.dataset', record_type: 'resource', labels: [{ language: 'en', role: 'preferred', value: 'Wikidata referenced timeline claims' }], extensions: { datasetId: 'mw:dataset:world-religions:timeline-wikidata', version: '0.1.0', license: 'CC0-1.0', publisher: 'Wikimedia Foundation and Wikidata contributors', locator: 'https://www.wikidata.org/wiki/Wikidata:Data_access', retrievedAt: '2026-08-27T00:00:00Z', inputSnapshotManifest: 'datasets/registries/snapshots/wikidata/snapshot-manifest.json', inputSnapshotSha256: sha256(await readFile(path.join(snapshot, 'snapshot-manifest.json'))) } })}\n`)
const manifest = { id: 'mw:dataset:world-religions:timeline-wikidata', datasetVersion: '0.1.0', specVersion: '0.1', profiles: [], dependencies: [{ dataset: 'mw:dataset:world-religions:baseline', version: '0.1.0' }], partitions: [{ recordType: 'entity', path: 'data/core/entities/*.jsonl' }, { recordType: 'resource', path: 'data/core/resources/*.jsonl' }, { recordType: 'assertion', path: 'data/core/assertions/*.jsonl' }, { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }], sources: ['Wikidata Special:EntityData pinned bounded snapshot; source statement references retained in extensions.timeline'], rights: 'Wikidata structured data is CC0 1.0.', availability: 'bundled' }
await writeFile(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(path.join(out, 'source-manifest.json'), `${JSON.stringify({ datasetId: manifest.id, name: 'Wikidata referenced timeline claims', version: manifest.datasetVersion, publisher: 'Wikimedia Foundation and Wikidata contributors', locator: 'https://www.wikidata.org/wiki/Wikidata:Data_access', license: 'CC0-1.0', retrievedAt: '2026-08-27T00:00:00Z', sha256: sha256(await readFile(path.join(snapshot, 'snapshot-manifest.json'))), ingestion: { recordsEvaluated: entityFiles.length * 2, recordsAccepted: accepted.length, recordsRejected: entityFiles.length * 2 - accepted.length, rejectionReasons: ['No referenced value claim for P569/P570'] } }, null, 2)}\n`)
console.log(JSON.stringify({ recordsEvaluated: entityFiles.length * 2, recordsAccepted: accepted.length, recordsRejected: entityFiles.length * 2 - accepted.length, events: entities.length }, null, 2))

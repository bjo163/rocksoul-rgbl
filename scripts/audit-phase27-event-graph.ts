import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'

export interface EventGraphMatrixRow {
  event: string
  person: string | null
  tradition: string | null
  work: string | null
  place: string | null
  era: string | null
  source: string[]
  temporalStatus: string
  evidenceStatus: string
}

export interface EventGraphAudit {
  events: number
  eventsWithTradition: number
  eventsWithWork: number
  eventsWithPlace: number
  eventsWithEra: number
  eventsWithSource: number
  eventsWithMultipleSources: number
  eventsWithIndependentSources: number
  traditionsWithEvents: number
  worksWithEvents: number
  placesWithEvents: number
  erasWithEvents: number
  personsWithEvents: number
  matrix: EventGraphMatrixRow[]
}

export function auditEventGraph(records: Array<Record<string, any>>): EventGraphAudit {
  const events = records.filter((r) => r.id?.startsWith('mw:event:'))
  const assertions = records.filter((r) => r.record_type === 'assertion')
  const byEvent = new Map<string, Record<string, any>[]>()
  for (const assertion of assertions) {
    const event = assertion.subject?.startsWith('mw:event:') ? assertion.subject : assertion.object?.entity?.startsWith('mw:event:') ? assertion.object.entity : undefined
    if (event) (byEvent.get(event) ?? (byEvent.set(event, []), byEvent.get(event)!)).push(assertion)
  }
  const matrix: EventGraphMatrixRow[] = events.map((event) => {
    const timeline = event.extensions?.timeline ?? {}
    const linked = byEvent.get(event.id) ?? []
    const target = (prefix: string) => linked.map((a) => a.subject === event.id ? a.object?.entity : a.subject).find((id) => typeof id === 'string' && id.startsWith(prefix)) ?? null
    const source = [...new Set([...(timeline.sourceIds ?? []), ...linked.flatMap((a) => a.extensions?.timeline?.sourceIds ?? [])].filter((id: unknown): id is string => typeof id === 'string'))].sort()
    return { event: event.id, person: target('mw:person:'), tradition: target('mw:tradition:'), work: target('mw:work:'), place: target('mw:place:'), era: target('mw:era:'), source, temporalStatus: timeline.temporal?.status ?? 'UNKNOWN', evidenceStatus: timeline.temporal?.status ?? 'UNKNOWN' }
  }).sort((a, b) => a.event.localeCompare(b.event))
  const count = (key: keyof EventGraphMatrixRow) => new Set(matrix.map((row) => row[key]).filter((value) => typeof value === 'string' && value.length > 0)).size
  const eventHasProvenance = new Set(events.filter((event) => typeof event.extensions?.timeline?.provenanceId === 'string').map((event) => event.id))
  return { events: matrix.length, eventsWithTradition: count('tradition'), eventsWithWork: count('work'), eventsWithPlace: count('place'), eventsWithEra: count('era'), eventsWithSource: matrix.filter((row) => row.source.length > 0 || eventHasProvenance.has(row.event)).length, eventsWithMultipleSources: matrix.filter((row) => row.source.length > 1).length, eventsWithIndependentSources: 0, traditionsWithEvents: count('tradition'), worksWithEvents: count('work'), placesWithEvents: count('place'), erasWithEvents: count('era'), personsWithEvents: count('person'), matrix }
}

if (process.argv.includes('--run')) {
  const root = process.cwd()
  const repository = await FileSystemCorpusRepository.open(root)
  const records: Array<Record<string, any>> = []
  for await (const record of repository.iterateRecords()) records.push(record as Record<string, any>)
  const report = auditEventGraph(records)
  await mkdir(path.join(root, 'dist'), { recursive: true })
  await writeFile(path.join(root, 'dist/phase27-event-graph-audit.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ ...report, matrix: `[${report.matrix.length} rows]` }, null, 2))
}

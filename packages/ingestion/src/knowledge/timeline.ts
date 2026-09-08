import type { TimelineQueryIndex } from './types.js'

function add<K extends string | number>(map: Map<K, string[]>, key: K, eventId: string): void {
  const values = map.get(key) ?? []
  if (!values.includes(eventId)) values.push(eventId)
  map.set(key, values)
}

function entity(record: Record<string, any>): string | undefined {
  return typeof record.object?.entity === 'string' ? record.object.entity : undefined
}

export function buildTimelineQueryIndex(records: Array<Record<string, any>>): TimelineQueryIndex {
  const index: TimelineQueryIndex = { byPerson: new Map(), byTradition: new Map(), byWork: new Map(), byPlace: new Map(), byEra: new Map(), bySource: new Map(), byYear: new Map() }
  for (const record of records) {
    if (record.record_type !== 'assertion' || typeof record.subject !== 'string') continue
    const object = entity(record)
    const predicate = String(record.predicate ?? '')
    const event = record.subject.startsWith('mw:event:') ? record.subject : object?.startsWith('mw:event:') ? object : undefined
    if (!event) continue
    const other = record.subject === event ? object : record.subject
    if (other?.startsWith('mw:person:')) add(index.byPerson, other, event)
    if (other?.startsWith('mw:tradition:')) add(index.byTradition, other, event)
    if (other?.startsWith('mw:work:')) add(index.byWork, other, event)
    if (other?.startsWith('mw:place:')) add(index.byPlace, other, event)
    if (other?.startsWith('mw:era:')) add(index.byEra, other, event)
    if (typeof record.provenance === 'string') add(index.bySource, record.provenance, event)
    void predicate
  }
  for (const record of records) {
    if (record.id?.startsWith('mw:event:')) {
      const year = record.extensions?.timeline?.temporal?.year
      if (Number.isInteger(year)) add(index.byYear, year, record.id)
    }
  }
  for (const values of Object.values(index)) for (const ids of values.values()) ids.sort()
  return index
}
